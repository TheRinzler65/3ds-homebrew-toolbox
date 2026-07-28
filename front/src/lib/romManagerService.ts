import { isTauri } from "./forwarderService";
import type { ROMEntry } from "@/types";

async function invoke(cmd: string, args: any): Promise<any> {
  if (isTauri()) {
    const { invoke: ti } = await import("@tauri-apps/api/core");
    return ti(cmd, { args });
  }
  const res = await fetch(`/api/rom/${cmd}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text();
    try { const j = JSON.parse(text); throw new Error(j.error || j.message || text); }
    catch { throw new Error(text || `HTTP ${res.status}`); }
  }
  return res.json();
}

export async function browseDir(path: string): Promise<{ dir: string; files: ROMEntry[] }> {
  const r = await invoke("browse", { path });
  if (!r.ok) throw new Error(r.error || "Browse failed");
  return { dir: r.dir, files: r.files };
}

export async function getROMInfo(path: string): Promise<string> {
  const r = await invoke("info", { path });
  if (!r.ok) throw new Error(r.error || "Info failed");
  return r.stdout || r.info || "";
}

export async function getExtendedROMInfo(path: string): Promise<{ info: string; icon_base64: string | null }> {
  const r = await invoke("info-extended", { path });
  if (!r.ok) throw new Error(r.error || "Info failed");
  return { info: r.info || "", icon_base64: r.icon_base64 || null };
}

export async function convertToCIA(path: string): Promise<string> {
  const r = await invoke("to-cia", { path });
  if (!r.ok) throw new Error(r.error || "Conversion failed");
  return r.output || "";
}

export async function convertToCCI(path: string): Promise<string> {
  const r = await invoke("to-cci", { path });
  if (!r.ok) throw new Error(r.error || "Conversion failed");
  return r.output || "";
}

export async function compressROM(path: string, level: number): Promise<string> {
  const r = await invoke("compress", { path, level });
  if (!r.ok) throw new Error(r.error || "Compression failed");
  return r.output || "";
}

export async function decompressROM(path: string): Promise<string> {
  const r = await invoke("decompress", { path });
  if (!r.ok) throw new Error(r.error || "Decompression failed");
  return r.output || "";
}

async function uploadFiles(files: File[]): Promise<{ dir: string; entries: ROMEntry[] } | null> {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  try {
    const res = await fetch("/api/rom/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Upload failed");
    const entries: ROMEntry[] = data.files.map((f: any) => ({
      name: f.name,
      size: f.size,
      mtime: 0,
      _path: f.path,
    }));
    return { dir: data.dir, entries };
  } catch (err: any) {
    throw err;
  }
}

function webFileDialog(opts: { dir?: boolean; accept?: string; multi?: boolean }): Promise<File[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";
    if (opts.dir) (input as any).webkitdirectory = true;
    if (opts.multi) input.multiple = true;
    if (opts.accept) input.accept = opts.accept;
    document.body.appendChild(input);

    let done = false;
    const finish = (result: any) => { if (!done) { done = true; cleanup(); resolve(result); } };
    const cleanup = () => {
      window.removeEventListener("focus", onFocus);
      input.remove();
    };
    const onFocus = () => setTimeout(() => {
      if (!input.files) return;
      if (input.files.length === 0) finish(null);
    }, 500);

    input.addEventListener("change", () => {
      const files = input.files ? Array.from(input.files) : [];
      if (files.length === 0) { finish(null); return; }
      finish(files);
    });

    window.addEventListener("focus", onFocus);
    input.click();
  });
}

export async function pickFolder(): Promise<{ dir: string; files: ROMEntry[] } | null> {
  if (isTauri()) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({ directory: true, multiple: false, title: "Select ROM folder" });
    if (!selected) return null;
    const result = await browseDir(selected);
    return { dir: result.dir, files: result.files };
  }
  const files = await webFileDialog({ dir: true });
  if (!files) return null;
  const dir = files.length > 0 ? files[0].webkitRelativePath.split("/")[0] : "picked";
  const uploaded = await uploadFiles(files);
  if (!uploaded) return null;
  return { dir, files: uploaded.entries };
}

export async function pickROMs(): Promise<ROMEntry[] | null> {
  if (isTauri()) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      multiple: true,
      title: "Select ROM files",
      filters: [{ name: "ROMs", extensions: ["3ds", "cci", "cxi", "app", "3dsx", "nds"] }],
    });
    if (!selected) return null;
    const paths = Array.isArray(selected) ? selected : [selected];
    const entries: ROMEntry[] = paths.map((p) => {
      const parts = p.replace(/\\/g, "/").split("/");
      return { name: parts[parts.length - 1], size: 0, mtime: 0, _path: p };
    });
    return entries;
  }
  const files = await webFileDialog({ multi: true, accept: ".3ds,.cci,.cxi,.app,.3dsx,.nds" });
  if (!files) return null;
  const uploaded = await uploadFiles(files);
  if (!uploaded) return null;
  return uploaded.entries;
}
