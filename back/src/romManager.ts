import { FastifyInstance } from "fastify";
import { execFile } from "node:child_process";
import { writeFile, readFile, unlink, mkdir, readdir, stat } from "node:fs/promises";
import { tmpdir, platform } from "node:os";
import { join, resolve, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BIN_DIR = join(ROOT, "bin");

function toolPath(name: string): string {
  const p = join(BIN_DIR, name);
  return existsSync(p) ? p : name;
}

function run(cmd: string, args: string[], opts?: { cwd?: string; timeout?: number }): Promise<{ stdout: string; stderr: string }> {
  return new Promise((res, rej) => {
    execFile(cmd, args, { timeout: opts?.timeout ?? 120_000, cwd: opts?.cwd }, (err, stdout, stderr) => {
      if (err) rej(Object.assign(err, { stdout, stderr }));
      else res({ stdout, stderr });
    });
  });
}

const CIACONV = toolPath("3dsconv.exe");
const MAKEROM = toolPath("makerom.exe");
const CTRTOOL = toolPath("ctrtool.exe");
const DECRYPT = toolPath("decrypt.exe");
const Z3DS = toolPath("z3ds_compressor.exe");
const SEEDDB = join(BIN_DIR, "seeddb.bin");

export async function registerRomRoutes(app: FastifyInstance) {
  app.addContentTypeParser("application/octet-stream", { parseAs: "buffer", bodyLimit: 512 * 1024 * 1024 }, (_req, body, done) => done(null, body));

  // ── File list from a directory ─────────────────────────────────────────
  app.post("/api/rom/browse", async (req, reply) => {
    const { path } = req.body as { path?: string };
    const dir = path || process.cwd();
    const exts = [".3ds", ".cci", ".cia", ".z3ds", ".zcci", ".zcia"];
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      const files = await Promise.all(
        entries
          .filter(e => e.isFile() && exts.some(ext => e.name.toLowerCase().endsWith(ext)))
          .map(async e => {
            const s = await stat(join(dir, e.name));
            return { name: e.name, size: s.size, mtime: s.mtimeMs };
          })
      );
      files.sort((a, b) => a.name.localeCompare(b.name));
      return reply.send({ ok: true, dir, files });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message });
    }
  });

  // ── Get ROM info via ctrtool ───────────────────────────────────────────
  app.post("/api/rom/info", async (req, reply) => {
    const { path } = req.body as { path?: string };
    if (!path || !existsSync(path)) return reply.status(400).send({ ok: false, error: "File not found" });
    try {
      const seedFlag = existsSync(SEEDDB) ? [`--seeddb=${SEEDDB}`] : [];
      const { stdout } = await run(CTRTOOL, [...seedFlag, path]);
      return reply.send({ ok: true, info: stdout });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.stderr || err.message });
    }
  });

  // ── Convert to CIA (3dsconv) ───────────────────────────────────────────
  app.post("/api/rom/to-cia", async (req, reply) => {
    const { path } = req.body as { path?: string };
    if (!path || !existsSync(path)) return reply.status(400).send({ ok: false, error: "File not found" });
    const out = path.replace(/\.(3ds|cci)$/i, ".cia");
    if (out === path) return reply.status(400).send({ ok: false, error: "Unsupported extension" });
    try {
      const { stdout, stderr } = await run(CIACONV, ["--no-fw-spoof", "--overwrite", path, out]);
      return reply.send({ ok: true, output: out, stdout, stderr });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.stderr || err.message });
    }
  });

  // ── Convert to CCI (makerom -ciatocci) ─────────────────────────────────
  app.post("/api/rom/to-cci", async (req, reply) => {
    const { path } = req.body as { path?: string };
    if (!path || !existsSync(path)) return reply.status(400).send({ ok: false, error: "File not found" });
    const out = path.replace(/\.cia$/i, ".cci");
    if (out === path) return reply.status(400).send({ ok: false, error: "Unsupported extension" });
    try {
      const { stdout, stderr } = await run(MAKEROM, ["-ciatocci", path, "-o", out]);
      return reply.send({ ok: true, output: out, stdout, stderr });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.stderr || err.message });
    }
  });

  // ── Decrypt ROM ────────────────────────────────────────────────────────
  app.post("/api/rom/decrypt", async (req, reply) => {
    const { path, format } = req.body as { path?: string; format?: "cia" | "cci" };
    if (!path || !existsSync(path)) return reply.status(400).send({ ok: false, error: "File not found" });

    const tmp = tmpdir();
    const id = randomUUID();

    try {
      const seedFlag = existsSync(SEEDDB) ? [`--seeddb=${SEEDDB}`] : [];
      const { stdout: info } = await run(CTRTOOL, [...seedFlag, path]);

      const isCIA = path.toLowerCase().endsWith(".cia");
      let ncchDir = tmp;
      let ciaPath = path;

      if (isCIA) {
        const unpackDir = join(tmp, id);
        await mkdir(unpackDir, { recursive: true });
        const { stdout: unpackOut } = await run(CTRTOOL, ["--cia", path, "--content=" + unpackDir]);
        ncchDir = unpackDir;
      }

      const ncchFiles = (await readdir(ncchDir)).filter(f => f.endsWith(".ncch") || f.endsWith(".app"));
      if (ncchFiles.length === 0) throw new Error("No NCCH content found");

      const decDir = join(tmp, `${id}_dec`);
      await mkdir(decDir, { recursive: true });

      for (const ncch of ncchFiles) {
        const inPath = join(ncchDir, ncch);
        const outPath = join(decDir, ncch.replace(/\.(ncch|app)$/i, ".dec"));
        await run(DECRYPT, [inPath, outPath]);
      }

      if (format === "cci") {
        const outName = path.replace(/\.(3ds|cci|cia)$/i, "_decrypted.cci");
        const decFiles = (await readdir(decDir)).filter(f => f.endsWith(".dec"));
        if (decFiles.length === 0) throw new Error("No decrypted files");
        const { stdout, stderr } = await run(MAKEROM, ["-f", "cci", "-i", join(decDir, decFiles[0]), "-o", outName]);
        return reply.send({ ok: true, output: outName, stdout, stderr });
      } else {
        const outName = path.replace(/\.(3ds|cci|cia)$/i, "_decrypted.cia");
        const decFiles = (await readdir(decDir)).filter(f => f.endsWith(".dec"));
        if (decFiles.length === 0) throw new Error("No decrypted files");
        const { stdout, stderr } = await run(MAKEROM, ["-f", "cia", "-ignoresign", "-target", "p", "-i", join(decDir, decFiles[0]), "-o", outName]);
        return reply.send({ ok: true, output: outName, stdout, stderr });
      }
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.stderr || err.message || String(err) });
    } finally {
      // Ponytail: global cleanup — race-safe enough for a local tmp tool
      readdir(tmp)
        .then(all => all.filter(f => f.startsWith(id)).map(f => unlink(join(tmp, f)).catch(() => {})))
        .catch(() => {});
      readdir(tmp)
        .then(all => all.filter(f => f.startsWith(`${id}_dec`)).map(f => unlink(join(tmp, f)).catch(() => {})))
        .catch(() => {});
    }
  });

  // ── Compress Z3DS ──────────────────────────────────────────────────────
  app.post("/api/rom/compress", async (req, reply) => {
    const { path, level } = req.body as { path?: string; level?: number };
    if (!path || !existsSync(path)) return reply.status(400).send({ ok: false, error: "File not found" });
    const lvl = Math.min(9, Math.max(1, level || 3));
    try {
      const inputDir = dirname(path);
      const { stdout, stderr } = await run(Z3DS, [`-${lvl}`, path], { cwd: inputDir });
      // z3ds_compressor creates output in the same directory
      const z3dsPath = path + (path.endsWith(".3ds") ? ".z3ds" : path.endsWith(".cia") ? ".zcia" : ".zcci");
      return reply.send({ ok: true, output: existsSync(z3dsPath) ? z3dsPath : path + ".z3ds", stdout, stderr });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.stderr || err.message });
    }
  });

  // ── Decompress Z3DS ────────────────────────────────────────────────────
  app.post("/api/rom/decompress", async (req, reply) => {
    const { path } = req.body as { path?: string };
    if (!path || !existsSync(path)) return reply.status(400).send({ ok: false, error: "File not found" });
    try {
      const inputDir = dirname(path);
      const { stdout, stderr } = await run(Z3DS, ["--decompress", path], { cwd: inputDir });
      return reply.send({ ok: true, stdout, stderr });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.stderr || err.message });
    }
  });
}
