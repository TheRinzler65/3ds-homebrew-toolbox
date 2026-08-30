import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, FolderOpen, File } from "lucide-react";
import { toast } from "sonner";
import { FileList } from "@/components/tools/rom-manager/FileList";
import { ActionBar } from "@/components/tools/rom-manager/ActionBar";
import { ROMSettings } from "@/components/tools/rom-manager/SettingsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useROMStore } from "@/store/romManagerStore";
import * as ROM from "@/lib/romManagerService";
import { InfoPanel } from "@/components/tools/rom-manager/InfoPanel";
import type { ROMEntry } from "@/types";

export default function ROMToolsPage() {
  const { t } = useTranslation();
  const currentDir = useROMStore((s) => s.currentDir);
  const setCurrentDir = useROMStore((s) => s.setCurrentDir);
  const setFiles = useROMStore((s) => s.setFiles);
  const loading = useROMStore((s) => s.loading);
  const setLoading = useROMStore((s) => s.setLoading);
  const operations = useROMStore((s) => s.operations);
  const clearOperations = useROMStore((s) => s.clearOperations);
  const [dirInput, setDirInput] = useState(currentDir);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [infoFile, setInfoFile] = useState<ROMEntry | null>(null);

  useEffect(() => {
    if (currentDir) {
      loadDir(currentDir);
    }
  }, []);

  const loadDir = async (dir: string) => {
    setLoading(true);
    try {
      const result = await ROM.browseDir(dir);
      setCurrentDir(result.dir);
      setFiles(result.files);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowse = () => {
    if (!dirInput.trim()) return;
    setCurrentDir(dirInput.trim());
    loadDir(dirInput.trim());
  };

  const handlePickFolder = async () => {
    setLoading(true);
    try {
      const result = await ROM.pickFolder();
      if (result) {
        setDirInput(result.dir);
        setCurrentDir(result.dir);
        setFiles(result.files);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePickFiles = async () => {
    setLoading(true);
    try {
      const files = await ROM.pickROMs();
      if (files) {
        setFiles(files);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-border)] shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-[var(--color-text)]">
            {t("rom_manager.title")}
          </h1>
          <p className="text-xs text-[var(--color-text-subtle)]">
            {t("rom_manager.subtitle")}
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col gap-3 p-5 overflow-y-auto">
          <div className="flex gap-2">
            <Input
              value={dirInput}
              onChange={(e) => setDirInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBrowse()}
              placeholder="C:/ROMS"
              className="font-mono text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handlePickFolder}
              disabled={loading}
              title="Choisir un dossier"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePickFiles}
              disabled={loading}
              title="Choisir un ou plusieurs fichiers ROM"
            >
              <File className="w-3.5 h-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-[var(--color-text-subtle)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("rom_manager.loading")}
            </div>
          ) : (
            <FileList />
          )}

          <div className="space-y-1">
            {operations.length > 0 && (
              <div className="space-y-0.5 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-subtle)]">{t("rom_manager.operations")}</span>
                  <button className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text)]" onClick={clearOperations}>
                    {t("rom_manager.clear")}
                  </button>
                </div>
                {operations.slice(-10).map((op) => (
                  <div key={op.id} className="flex items-center gap-2 text-xs">
                    <span className={op.status === "done" ? "text-[var(--color-success)]" : op.status === "error" ? "text-[var(--color-danger)]" : "text-[var(--color-warning)]"}>
                      ●
                    </span>
                    <span className="text-[var(--color-text-muted)] truncate flex-1">{op.file}</span>
                    <span className="text-[var(--color-text-subtle)]">{op.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-5 w-64 shrink-0 border-l border-[var(--color-border)] overflow-y-auto">
          <ActionBar onShowInfo={(f) => setInfoFile(f)} />
        </div>

        {infoFile && <InfoPanel file={infoFile} onClose={() => setInfoFile(null)} />}

        <ROMSettings />
      </div>
    </div>
  );
}
