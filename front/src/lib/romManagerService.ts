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
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
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
