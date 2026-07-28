import Fastify from "fastify";
import cors from "@fastify/cors";
import { execFile } from "node:child_process";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { tmpdir, platform } from "node:os";
import { join, resolve, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { registerRomRoutes } from "./romManager.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TEMPLATES_DIR = resolve(__dirname, "../../desktop/src-tauri/templates");

// ─── Résolution du binaire make_cia ──────────────────────────────────────────
// Priorité : MAKE_CIA_PATH env → binaire OS-spécifique dans backend/ → PATH
function findMakeCia(): string {
  if (process.env.MAKE_CIA_PATH) return process.env.MAKE_CIA_PATH;

  const os = platform();
  const candidates: string[] = [];

  if (os === "win32") {
    candidates.push(join(ROOT, "make_cia.exe"));
  } else if (os === "darwin") {
    candidates.push(join(ROOT, "make_cia_macos"));
    candidates.push(join(ROOT, "make_cia"));
  } else {
    // Linux / Docker
    candidates.push(join(ROOT, "make_cia_linux"));
    candidates.push(join(ROOT, "make_cia"));
  }

  for (const c of candidates) {
    if (existsSync(c)) return c;
  }

  return "make_cia"; // fallback PATH
}

const MAKE_CIA = findMakeCia();

// ─── App ─────────────────────────────────────────────────────────────────────
const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

// Parser pour application/octet-stream
app.addContentTypeParser(
  "application/octet-stream",
  { parseAs: "buffer", bodyLimit: 512 * 1024 * 1024 },
  (_req, body, done) => done(null, body)
);

app.get("/health", async () => ({
  ok: true,
  make_cia: MAKE_CIA,
  exists: existsSync(MAKE_CIA),
}));

// ─── POST /api/makecia ────────────────────────────────────────────────────────
// Body   : application/octet-stream (bytes binaires du NDS template)
// Header : X-Filename: nom.nds
// Réponse: application/octet-stream (bytes du CIA)
//
// Commande : make_cia --srl=template.nds --out=output.cia
// (CTR_Toolkit v6.4 — même outil qu'Olmectron Forwarder3DS embarque)
app.post("/api/makecia", { bodyLimit: 512 * 1024 * 1024 }, async (request, reply) => {
  const fileName =
    (request.headers["x-filename"] as string | undefined) ?? "forwarder.nds";

  const ndsBuffer = request.body as Buffer;
  if (!ndsBuffer || ndsBuffer.length === 0) {
    return reply.status(400).send("Fichier NDS vide");
  }

  const id = randomUUID();
  const ndsName = `${id}.nds`;
  const ciaName = `${id}.cia`;
  const tmpDir = tmpdir();
  const ndsPath = join(tmpDir, ndsName);
  const ciaPath = join(tmpDir, ciaName);

  try {
    await writeFile(ndsPath, ndsBuffer);
    app.log.info(`NDS écrit : ${ndsPath} (${ndsBuffer.length} bytes)`);

    const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>(
      (res, rej) => {
        execFile(
          MAKE_CIA,
          // make_cia génère le .cia automatiquement dans le même dossier
          // Utilise le nom relatif car cwd=tmpDir (évite les problèmes de \ avec les chemins Windows)
          ["--srl=" + ndsName],
          { timeout: 120_000, cwd: tmpDir },
          (err, stdout, stderr) => {
            if (err) rej(Object.assign(err, { stdout, stderr }));
            else res({ stdout, stderr });
          }
        );
      }
    );

    app.log.info({ stdout, stderr }, "make_cia terminé");

    // Chercher le .cia généré (make_cia auto-génère le nom de sortie)
    let ciaPathFound = ciaPath;
    if (!existsSync(ciaPathFound)) {
      const ciaFiles = readdirSync(tmpDir).filter(f => f.endsWith(".cia") && f.includes(id));
      if (ciaFiles.length > 0) {
        ciaPathFound = join(tmpDir, ciaFiles[0]);
      } else {
        // Fallback: chercher n'importe quel .cia récent
        const allCia = readdirSync(tmpDir)
          .filter(f => f.endsWith(".cia"))
          .sort((a, b) => statSync(join(tmpDir, b)).mtimeMs - statSync(join(tmpDir, a)).mtimeMs);
        if (allCia.length > 0) {
          ciaPathFound = join(tmpDir, allCia[0]);
        }
      }
    }

    if (!existsSync(ciaPathFound)) {
      const errMsg = stderr || stdout || "make_cia n'a pas produit de CIA";
      app.log.error(errMsg);
      return reply.status(500).send(errMsg);
    }

    const ciaBuffer = await readFile(ciaPathFound);
    const outName = fileName
      .replace(/\.nds$/i, ".cia")
      .replace(/\.dsi$/i, ".cia");

    app.log.info(`CIA généré : ${ciaPath} (${ciaBuffer.length} bytes) → ${outName}`);

    return reply
      .header("Content-Type", "application/octet-stream")
      .header("X-Filename", outName)
      .header("Access-Control-Expose-Headers", "X-Filename")
      .send(ciaBuffer);

  } catch (err: unknown) {
    const e = err as any;
    const msg = [e?.message, e?.stderr, e?.stdout].filter(Boolean).join("\n");
    app.log.error({ err }, "Échec make_cia");
    return reply.status(500).send(msg || "Erreur inconnue");
  } finally {
    await unlink(ndsPath).catch(() => {});
    await unlink(ciaPath).catch(() => {});
  }
});

// ─── GET /api/forwarders/* — templates servis localement ────────────────────
app.get("/api/forwarders/list.txt", async (_req, reply) => {
  const listPath = join(TEMPLATES_DIR, "list.txt");
  if (!existsSync(listPath)) return reply.status(404).send("list.txt not found");
  return reply.type("text/plain").send(readFileSync(listPath, "utf-8"));
});

app.get<{ Params: { id: string } }>("/api/forwarders/:id.fwd", async (req, reply) => {
  const fwdPath = join(TEMPLATES_DIR, `${req.params.id}.fwd`);
  if (!existsSync(fwdPath)) return reply.status(404).send("Not found");
  return reply.type("text/plain").send(readFileSync(fwdPath, "utf-8"));
});

app.get<{ Params: { id: string } }>("/api/forwarders/:id.nds", async (req, reply) => {
  const ndsPath = join(TEMPLATES_DIR, `${req.params.id}.nds`);
  if (!existsSync(ndsPath)) return reply.status(404).send("Not found");
  return reply.type("application/octet-stream").send(readFileSync(ndsPath));
});

// ─── ROM Manager routes ───────────────────────────────────────────────────
await registerRomRoutes(app);

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";
await app.listen({ port: PORT, host: HOST });
console.log(`✅  Backend actif sur http://${HOST}:${PORT}`);
console.log(`📁  Templates  : ${TEMPLATES_DIR}`);
console.log(`🔧  make_cia   : ${MAKE_CIA} (${existsSync(MAKE_CIA) ? "✓ trouvé" : "✗ introuvable"})`);
