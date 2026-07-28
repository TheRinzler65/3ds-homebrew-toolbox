import { useThemeStore } from "@/stores/themeStore";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors"
    >
      {theme === "dark" ? "Clair" : "Sombre"}
    </button>
  );
}
