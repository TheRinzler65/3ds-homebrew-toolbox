import { useThemeStore, type Accent, ACCENT_LABELS, ACCENT_COLORS } from "@/stores/themeStore";
import { cn } from "@/lib/utils";

const ACCENTS = Object.keys(ACCENT_LABELS) as Accent[];

export function AccentPicker() {
  const accent = useThemeStore((s) => s.accent);
  const setAccent = useThemeStore((s) => s.setAccent);
  const theme = useThemeStore((s) => s.theme);

  return (
    <div className="flex items-center gap-1.5">
      {ACCENTS.map((a) => {
        const color = ACCENT_COLORS[a][theme];
        return (
          <button
            key={a}
            onClick={() => setAccent(a)}
            className={cn(
              "w-5 h-5 rounded-full transition-all border-2",
              accent === a
                ? "border-[var(--color-text)] scale-110"
                : "border-transparent hover:scale-110"
            )}
            style={{ backgroundColor: color }}
            title={ACCENT_LABELS[a]}
          />
        );
      })}
    </div>
  );
}
