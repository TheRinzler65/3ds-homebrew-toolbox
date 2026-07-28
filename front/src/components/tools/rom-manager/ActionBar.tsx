import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, FileDown, Shrink, Expand, Unlock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useROMStore } from "@/store/romManagerStore";
import * as ROM from "@/lib/romManagerService";

export function ActionBar() {
  const { t } = useTranslation();
  const files = useROMStore((s) => s.files);
  const selected = useROMStore((s) => s.selected);
  const currentDir = useROMStore((s) => s.currentDir);
  const z3dsLevel = useROMStore((s) => s.z3dsLevel);
  const addOperation = useROMStore((s) => s.addOperation);
  const updateOperation = useROMStore((s) => s.updateOperation);
  const [running, setRunning] = useState(false);

  const selectedFiles = [...selected].map((i) => files[i]).filter(Boolean);

  const runOnSelected = async (action: string, fn: (path: string) => Promise<string>) => {
    if (selectedFiles.length === 0) {
      toast.warning(t("rom_manager.select_first"));
      return;
    }
    setRunning(true);
    for (const f of selectedFiles) {
      const id = `${action}-${f.name}-${Date.now()}`;
      const fullPath = currentDir ? `${currentDir}/${f.name}` : f.name;
      addOperation({ id, type: action as any, file: f.name, status: "running" });
      try {
        const out = await fn(fullPath);
        updateOperation(id, { status: "done", message: out });
      } catch (err: any) {
        updateOperation(id, { status: "error", message: err.message });
      }
    }
    setRunning(false);
    toast.success(t("rom_manager.batch_done"));
  };

  return (
    <div className="space-y-1.5">
      <Button
        size="sm"
        className="w-full gap-1.5 text-xs"
        onClick={() => runOnSelected("to-cia", (p) => ROM.convertToCIA(p))}
        disabled={running || selectedFiles.length === 0}
      >
        {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
        {t("rom_manager.to_cia")}
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5 text-xs"
        onClick={() => runOnSelected("to-cci", (p) => ROM.convertToCCI(p))}
        disabled={running || selectedFiles.length === 0}
      >
        {t("rom_manager.to_cci")}
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5 text-xs"
        onClick={() => runOnSelected("compress", (p) => ROM.compressROM(p, z3dsLevel))}
        disabled={running || selectedFiles.length === 0}
      >
        <Shrink className="w-3 h-3" />
        {t("rom_manager.compress")} L{z3dsLevel}
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5 text-xs"
        onClick={() => runOnSelected("decompress", (p) => ROM.decompressROM(p))}
        disabled={running || selectedFiles.length === 0}
      >
        <Expand className="w-3 h-3" />
        {t("rom_manager.decompress")}
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5 text-xs"
        onClick={async () => {
          if (selectedFiles.length === 0) { toast.warning(t("rom_manager.select_first")); return; }
          setRunning(true);
          for (const f of selectedFiles) {
            try {
              const fullPath = currentDir ? `${currentDir}/${f.name}` : f.name;
              const info = await ROM.getROMInfo(fullPath);
              toast.info(`${f.name}`, { description: info.slice(0, 300), duration: 8000 });
            } catch (err: any) {
              toast.error(`${f.name}: ${err.message}`);
            }
          }
          setRunning(false);
        }}
        disabled={running || selectedFiles.length === 0}
      >
        <RefreshCw className="w-3 h-3" />
        {t("rom_manager.info")}
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5 text-xs"
        onClick={() => runOnSelected("decrypt", async (p) => {
          const r = await fetch("/api/rom/decrypt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: p, format: "cia" }),
          });
          const data = await r.json();
          if (!data.ok) throw new Error(data.error || "Decrypt failed");
          return data.output || "";
        })}
        disabled={running || selectedFiles.length === 0}
      >
        <Unlock className="w-3 h-3" />
        {t("rom_manager.decrypt")}
      </Button>

      {running && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-subtle)]">
          <Loader2 className="w-3 h-3 animate-spin" />
          {t("rom_manager.running")}
        </div>
      )}
    </div>
  );
}
