import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/stores/themeStore";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors"
    >
      {theme === "dark" ? t("theme.light") : t("theme.dark")}
    </button>
  );
}
