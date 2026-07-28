import { useRef, useState } from "react";
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
        "flex flex-col items-center justify-center gap-3 min-h-[200px] rounded-[var(--radius-md)] border-2 border-dashed transition-colors cursor-pointer",
        dragging
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
          : "border-[var(--color-border)] hover:border-[var(--color-text-subtle)]"
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

      <p className="text-sm text-[var(--color-text-muted)]">
        {dragging ? "Lâche ici" : "Dépose un .nds ou .dsi"}
      </p>
      <p className="text-xs text-[var(--color-text-subtle)]">
        ou clique pour choisir
      </p>
    </div>
  );
}
