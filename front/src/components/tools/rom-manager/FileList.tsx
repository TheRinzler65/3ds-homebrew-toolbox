import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useROMStore } from "@/store/romManagerStore";

export function FileList() {
  const { t } = useTranslation();
  const files = useROMStore((s) => s.files);
  const selected = useROMStore((s) => s.selected);
  const toggleSelect = useROMStore((s) => s.toggleSelect);
  const selectAll = useROMStore((s) => s.selectAll);
  const clearSelection = useROMStore((s) => s.clearSelection);

  const fmt = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-[var(--color-text-subtle)]">
        {t("rom_manager.no_files")}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[var(--color-text-muted)]">
          {t("rom_manager.file_count", { count: files.length })}
        </p>
        {selected.size === files.length ? (
          <button className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text)]" onClick={clearSelection}>
            {t("rom_manager.deselect_all")}
          </button>
        ) : (
          <button className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text)]" onClick={selectAll}>
            {t("rom_manager.select_all")}
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        {files.map((f, i) => (
          <div
            key={f.name}
            onClick={() => toggleSelect(i)}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-xs)] text-xs cursor-pointer transition-colors",
              selected.has(i)
                ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
            )}
          >
            <span className="flex-1 truncate font-mono">{f.name}</span>
            <span className="shrink-0 text-[var(--color-text-subtle)]">{fmt(f.size)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
