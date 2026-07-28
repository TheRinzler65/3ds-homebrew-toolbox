import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NDSFile } from "@/lib/ndsFile";
import type { NDSEntry, NDSFileData } from "@/types";

interface GameItemProps {
  entry: NDSEntry;
  onRemove: (id: string) => void;
  onUpdate: (id: string, data: Partial<NDSFileData>) => void;
}

export function GameItem({ entry, onRemove, onUpdate }: GameItemProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [ndsFile, setNdsFile] = useState<NDSFile | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const { id, file, data } = entry;

  useEffect(() => {
    const nds = new NDSFile(file, (internalData) => {
      onUpdate(id, internalData);
      if (internalData.canvasObject && canvasContainerRef.current) {
        const container = canvasContainerRef.current;
        while (container.firstChild) container.removeChild(container.lastChild!);
        container.appendChild(internalData.canvasObject);
      }
    });
    setNdsFile(nds);
    return () => nds.kill();
  }, [file, id]);

  const handleTidChange = (val: string) => {
    onUpdate(id, { overrideTid: val });
    if (ndsFile) ndsFile.overrideTid = val;
  };

  const handleTitleChange = (val: string) => {
    onUpdate(id, { gameTitle: val });
    if (ndsFile) ndsFile.gameTitle = val;
  };

  const handlePathChange = (val: string) => {
    onUpdate(id, { gamePath: val });
    if (ndsFile) ndsFile.gamePath = val;
  };

  const handleReloadTid = () => ndsFile?.reloadTid();
  const handleRemove = () => {
    ndsFile?.kill();
    onRemove(id);
  };

  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border transition-colors",
        expanded
          ? "border-[var(--color-accent)]/40"
          : "border-[var(--color-border)]"
      )}
    >
      <div
        className="flex items-center gap-2.5 p-2.5 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div
          ref={canvasContainerRef}
          className="nds-icon-canvas w-10 h-10 rounded-[var(--radius-xs)] overflow-hidden shrink-0 bg-[var(--color-surface)] flex items-center justify-center"
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--color-text)] truncate leading-tight">
            {data.name || file.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {data.overrideTid && (
              <span className="text-[10px] font-mono text-[var(--color-text-subtle)]">
                {data.overrideTid}
              </span>
            )}
            {data.publisher && (
              <span className="text-[10px] text-[var(--color-text-subtle)]">
                {data.publisher}
              </span>
            )}
          </div>
        </div>

        <span className="text-xs text-[var(--color-text-subtle)]">
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("game_item.tid")}</Label>
              <div className="flex gap-1">
                <Input
                  value={data.overrideTid ?? ""}
                  onChange={(e) => handleTidChange(e.target.value)}
                  maxLength={4}
                  className="font-mono text-xs"
                  placeholder={t("game_item.tid_placeholder")}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReloadTid();
                  }}
                  title={t("game_item.tid_new")}
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">{t("game_item.title")}</Label>
              <Input
                value={data.gameTitle ?? ""}
                onChange={(e) => handleTitleChange(e.target.value)}
                maxLength={12}
                className="font-mono text-xs"
                placeholder={t("game_item.title_placeholder")}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">{t("game_item.sd_path")}</Label>
            <Input
              value={data.gamePath ?? ""}
              onChange={(e) => handlePathChange(e.target.value)}
              className="font-mono text-xs"
              placeholder={t("game_item.sd_placeholder")}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1.5">
              <Badge variant="outline">
                {data.tid || "??"}
              </Badge>
            </div>
            <button
              className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-danger)] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              {t("game_item.remove")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
