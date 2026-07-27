import { convertCardFileToJSON, requestTextFile } from "./miscUtils";
import { downloadUrlAsByteArray } from "./hexUtils";
import type { ForwarderCard } from "@/types";

const FORWARDERS_BASE = "/api/forwarders";
const CIA_ENDPOINT = "/api/makecia";

// ─── Tauri runtime detection (fiable: basé sur le protocole) ───────────────
// En prod Tauri v2 : window.location.protocol = "tauri:" ou "https:" + hostname "tauri.localhost"
export function isTauri(): boolean {
  try {
    const p = window.location.protocol;
    const h = window.location.hostname;
    return p.startsWith("tauri") || h === "tauri.localhost";
  } catch {
    return false;
  }
}

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

// ─── Fetch forwarder list ──────────────────────────────────────────────────
export async function fetchForwarderList(): Promise<string[]> {
  if (isTauri()) {
    const data = await tauriInvoke<string>("read_forwarder_list");
    const separator = data.indexOf("\r\n") > -1 ? "\r\n" : "\n";
    return data.split(separator).filter(Boolean);
  }
  // Web mode: HTTP to backend
  const data = await requestTextFile(`${FORWARDERS_BASE}/list.txt`);
  if (!data) return [];
  const separator = data.indexOf("\r\n") > -1 ? "\r\n" : "\n";
  return data.split(separator).filter(Boolean);
}

// ─── Fetch single forwarder card config ────────────────────────────────────
export async function fetchForwarderCard(cardId: string): Promise<ForwarderCard | null> {
  let data: string | null = null;

  if (isTauri()) {
    data = await tauriInvoke<string>("read_forwarder_card", { id: cardId });
  } else {
    data = await requestTextFile(`${FORWARDERS_BASE}/${cardId}.fwd`);
  }

  if (!data) return null;
  const json = convertCardFileToJSON(data) as unknown as ForwarderCard;
  json.id = cardId;
  return json;
}

// ─── Fetch template binary ─────────────────────────────────────────────────
export async function fetchForwarderTemplate(cardId: string): Promise<number[]> {
  if (isTauri()) {
    return tauriInvoke<number[]>("read_template", { id: cardId });
  }
  return downloadUrlAsByteArray(`${FORWARDERS_BASE}/${cardId}.nds`);
}

// ─── CIA conversion ────────────────────────────────────────────────────────
export async function convertToCIA(
  bytes: number[] | Uint8Array,
  fileName: string
): Promise<{ success: true; ciaBytes: Uint8Array; fileName: string }
        | { success: false; error: string }> {
  const body = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  if (isTauri()) {
    try {
      const ciaBytes = await tauriInvoke<number[]>("make_cia", {
        ndsData: Array.from(body),
        fileName,
      });
      const outName = fileName.replace(/\.nds$/i, ".cia");
      return {
        success: true,
        ciaBytes: new Uint8Array(ciaBytes),
        fileName: outName,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Web mode: HTTP to backend
  try {
    const response = await fetch(CIA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Filename": fileName,
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => `HTTP ${response.status}`);
      return { success: false, error: text };
    }

    const outName = response.headers.get("X-Filename")
      ?? fileName.replace(/\.nds$/i, ".cia");
    const buffer = await response.arrayBuffer();
    return { success: true, ciaBytes: new Uint8Array(buffer), fileName: outName };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
export function buildCIABlob(ciaBytes: Uint8Array, fileName: string): Blob {
  const blob = new Blob([ciaBytes], { type: "application/octet-stream" });
  (blob as any).name = fileName;
  return blob;
}

export async function checkMakeCia(): Promise<boolean> {
  if (isTauri()) {
    try {
      return await tauriInvoke<boolean>("check_make_cia");
    } catch {
      return false;
    }
  }
  // Web mode
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return false;
    const { exists } = await res.json();
    return exists === true;
  } catch {
    return false;
  }
}
