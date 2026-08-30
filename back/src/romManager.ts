import { FastifyInstance } from "fastify";
import { execFile } from "node:child_process";
import { writeFile, readFile, unlink, mkdir, readdir, stat, rm } from "node:fs/promises";
import { tmpdir, platform } from "node:os";
import { join, resolve, dirname, basename } from "node:path";
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

const UPLOAD_DIR = join(tmpdir(), "multitools-uploads");

export async function registerRomRoutes(app: FastifyInstance) {
  // Ponytail: content-type parser for octet-stream is registered in index.ts

  // ── Upload files (web mode: browser picks files, sends them here) ──────
  app.post("/api/rom/upload", async (req, reply) => {
    await mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});
    const files: Array<{ name: string; path: string; size: number }> = [];
    try {
      for await (const part of req.files()) {
        const id = randomUUID();
        const dest = join(UPLOAD_DIR, `${id}_${part.filename}`);
        const buf = await part.toBuffer();
        await writeFile(dest, buf);
        files.push({ name: part.filename, path: dest, size: buf.length });
      }
      return reply.send({ ok: true, dir: UPLOAD_DIR, files });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });

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

  // ── Extended ROM info + icon ───────────────────────────────────────────
  function parseSMDHIcon(raw: Buffer): string | null {
    // Try two known offsets: 0x2408 (SMDH v1) and 0x4008 (SMDH v2)
    for (const off of [0x2408, 0x4008]) {
      if (raw.length < off + 4608) continue;
      const rgba = Buffer.alloc(48 * 48 * 4);
      for (let y = 0; y < 48; y++) {
        for (let x = 0; x < 48; x++) {
          const si = off + (y * 48 + x) * 2;
          const pixel = raw.readUInt16LE(si);
          const r = ((pixel >> 11) & 0x1F) * 255 / 31;
          const g = ((pixel >> 5) & 0x3F) * 255 / 63;
          const b = (pixel & 0x1F) * 255 / 31;
          const di = (y * 48 + x) * 4;
          rgba[di] = r;
          rgba[di + 1] = g;
          rgba[di + 2] = b;
          rgba[di + 3] = 255;
        }
      }
      return rgba.toString("base64");
    }
    return null;
  }

  app.post("/api/rom/info-extended", async (req, reply) => {
    const { path } = req.body as { path?: string };
    if (!path || !existsSync(path)) return reply.status(400).send({ ok: false, error: "File not found" });
    try {
      const seedFlag = existsSync(SEEDDB) ? [`--seeddb=${SEEDDB}`] : [];
      const { stdout } = await run(CTRTOOL, [...seedFlag, path]);
      let iconData: string | null = null;
      const tmpIcon = join(tmpdir(), `smdh_${randomUUID()}`);
      // Try --smdh first, then --exefs as fallback
      const methods: [string, string][] = [
        [`--smdh=${tmpIcon}.smdh`, tmpIcon + ".smdh"],
        [`--exefs=${tmpIcon}_exefs`, join(tmpIcon + "_exefs", "icon")],
      ];
      for (const [flag, iconFile] of methods) {
        try {
          await run(CTRTOOL, [...seedFlag, flag, path]);
          if (existsSync(iconFile)) {
            const raw = await readFile(iconFile);
            iconData = parseSMDHIcon(raw);
            if (iconData) break;
          }
        } catch { /* try next method */ }
      }
      // cleanup
      await unlink(tmpIcon + ".smdh").catch(() => {});
      await rm(tmpIcon + "_exefs", { recursive: true }).catch(() => {});
      return reply.send({ ok: true, info: stdout, iconData });
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
