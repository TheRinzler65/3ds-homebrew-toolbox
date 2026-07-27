import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Gamepad2,
} from "lucide-react";
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
  const [expanded, setExpanded] = useState(false);
  const [ndsFile, setNdsFile] = useState<NDSFile | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const { id, file, data } = entry;

  useEffect(() => {
    const nds = new NDSFile(file, (internalData) => {
      onUpdate(id, internalData);

      // Attach canvas
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

  const handleReloadTid = () => {
    ndsFile?.reloadTid();
  };

  const handleRemove = () => {
    ndsFile?.kill();
    onRemove(id);
  };

  const isNTR = !data.gameTitle?.includes("\0");

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border transition-all overflow-hidden",
        expanded
          ? "border-[var(--color-accent)]/40 bg-[var(--color-surface)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-subtle)]/40"
      )}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Game icon */}
        <div
          ref={canvasContainerRef}
          className="nds-icon-canvas w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden shrink-0 bg-[var(--color-surface-raised)] flex items-center justify-center"
        >
          <Gamepad2 className="w-5 h-5 text-[var(--color-text-subtle)]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-[var(--color-text)] truncate">
              {data.name || file.name}
            </p>
            {data.overrideTid && (
              <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                {data.overrideTid}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-[var(--color-text-subtle)] truncate">
              {data.publisher || "..."}
            </p>
            {data.gamePath && (
              <p className="text-xs text-[var(--color-accent-text)] truncate hidden sm:block font-mono">
                {data.gamePath}
              </p>
            )}
          </div>
        </div>

        {/* Chevron */}
        <Button variant="ghost" size="icon-sm" className="shrink-0" asChild>
          <span>
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </Button>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]/50 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* TID */}
            <div className="space-y-1.5">
              <Label className="text-xs">TID Override</Label>
              <div className="flex gap-1">
                <Input
                  value={data.overrideTid ?? ""}
                  onChange={(e) => handleTidChange(e.target.value)}
                  maxLength={4}
                  className="font-mono text-sm"
                  placeholder="XXXX"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReloadTid();
                  }}
                  title="Régénérer TID aléatoire"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Game title */}
            <div className="space-y-1.5">
              <Label className="text-xs">Titre interne</Label>
              <Input
                value={data.gameTitle ?? ""}
                onChange={(e) => handleTitleChange(e.target.value)}
                maxLength={12}
                className="font-mono text-sm"
                placeholder="TITLE"
              />
            </div>
          </div>

          {/* Game path */}
          <div className="space-y-1.5">
            <Label className="text-xs">Chemin ROM sur la SD</Label>
            <Input
              value={data.gamePath ?? ""}
              onChange={(e) => handlePathChange(e.target.value)}
              className="font-mono text-xs"
              placeholder="Games/NDS/game.nds"
            />
          </div>

          {/* ROM info */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              <Badge variant={isNTR ? "default" : "secondary"}>
                {isNTR ? "NTR" : "TWL"}
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px]">
                TID: {data.tid || "??"}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-[var(--color-danger)] hover:text-red-400 hover:bg-red-900/20"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Retirer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
