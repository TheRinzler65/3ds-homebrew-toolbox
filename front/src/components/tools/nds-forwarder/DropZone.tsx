import { useRef, useState } from "react";
import { Upload, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

export function DropZone({ onFiles }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(
      (f) => f.name.endsWith(".nds") || f.name.endsWith(".dsi")
    );
    if (valid.length > 0) onFiles(valid);
  };

  return (
    <div
      className={cn(
        "group flex flex-col items-center justify-center gap-4 min-h-[300px] rounded-[var(--radius-lg)] border-2 border-dashed transition-all cursor-pointer",
        dragging
          ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)]/20 scale-[1.02]"
          : "border-[var(--color-border)] hover:border-[var(--color-text-subtle)] hover:bg-[var(--color-surface-hover)]/40"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".nds,.dsi"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        className={cn(
          "flex items-center justify-center w-16 h-16 rounded-2xl transition-all",
          dragging
            ? "bg-[var(--color-accent)]/20 text-[var(--color-accent-text)] scale-110"
            : "bg-[var(--color-surface-raised)] text-[var(--color-text-subtle)] group-hover:scale-105"
        )}
      >
        <Upload className="w-7 h-7" />
      </div>

      <div className="text-center space-y-1">
        <p className="text-base font-medium text-[var(--color-text-muted)]">
          {dragging ? "Lâche les fichiers ici" : "Glisse tes ROMs ici"}
        </p>
        <p className="text-sm text-[var(--color-text-subtle)]">
          ou clique pour parcourir — .nds et .dsi acceptés
        </p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-colors group-hover:bg-[var(--color-surface-hover)]">
        <FolderOpen className="w-3.5 h-3.5 text-[var(--color-accent-text)]" />
        <span className="text-xs text-[var(--color-text-muted)]">
          Sélectionner des fichiers
        </span>
      </div>
    </div>
  );
}
