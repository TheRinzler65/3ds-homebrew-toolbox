import { useEffect, useRef, useState } from "react";
import { Loader2, X, RefreshCw, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import * as ROM from "@/lib/romManagerService";
import type { ROMEntry } from "@/types";

interface InfoPanelProps {
  file: ROMEntry;
  onClose: () => void;
}

export function InfoPanel({ file, onClose }: InfoPanelProps) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");
  const [iconBase64, setIconBase64] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    load();
    return () => { cancelled = true; };

    async function load() {
      if (!file._path) { setLoading(false); return; }
      setLoading(true);
      try {
        const r = await ROM.getExtendedROMInfo(file._path);
        if (cancelled) return;
        setInfo(r.info || "No output");
        setIconBase64(r.icon_base64);
      } catch (err: any) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
  }, [file._path]);

  useEffect(() => {
    if (!iconBase64 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const raw = Uint8Array.from(atob(iconBase64), (c) => c.charCodeAt(0));
    const imgData = ctx.createImageData(48, 48);
    for (let i = 0; i < raw.length; i++) imgData.data[i] = raw[i];
    ctx.putImageData(imgData, 0, 0);
  }, [iconBase64]);

  const parsed = parseInfo(info);

  return (
    <div className="w-72 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-xs font-medium text-[var(--color-text)]">Info ROM</span>
        <button onClick={onClose} className="text-[var(--color-text-subtle)] hover:text-[var(--color-text)]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-subtle)]" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden shrink-0 bg-[var(--color-surface-raised)] flex items-center justify-center">
              {iconBase64 ? (
                <canvas ref={canvasRef} width={48} height={48} className="w-12 h-12" />
              ) : (
                <Gamepad2 className="w-5 h-5 text-[var(--color-text-subtle)]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">{parsed.title || file.name}</p>
              <p className="text-xs text-[var(--color-text-subtle)] truncate">{parsed.publisher || "--"}</p>
            </div>
          </div>

          {parsed.lines.length > 0 && (
            <div className="space-y-1">
              {parsed.lines.map((line, i) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b border-[var(--color-border-subtle)] last:border-0">
                  <span className="text-[var(--color-text-subtle)] shrink-0">{line.label}</span>
                  <span className="text-[var(--color-text)] text-right ml-2 break-all">{line.value}</span>
                </div>
              ))}
            </div>
          )}

          <details>
            <summary className="text-xs text-[var(--color-text-subtle)] cursor-pointer hover:text-[var(--color-text)]">
              Sortie brute ctrtool
            </summary>
            <pre className="mt-2 text-[10px] text-[var(--color-text-muted)] whitespace-pre-wrap font-mono max-h-48 overflow-y-auto bg-[var(--color-surface-raised)] p-2 rounded-[var(--radius-sm)]">
              {info}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

interface ParsedInfo {
  title: string;
  publisher: string;
  lines: { label: string; value: string }[];
}

function parseInfo(raw: string): ParsedInfo {
  const lines: { label: string; value: string }[] = [];
  let title = "";
  let publisher = "";
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const label = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!label || !value) continue;
    lines.push({ label, value });
    if (/name|title/i.test(label) && !title) title = value;
    if (/maker|publisher|author/i.test(label) && !publisher) publisher = value;
  }
  return { title, publisher, lines };
}
