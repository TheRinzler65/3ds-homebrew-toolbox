import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGS = ["fr", "en", "es"] as const;

export function LanguagePicker() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      {LANGS.map((lng) => (
        <button
          key={lng}
          onClick={() => i18n.changeLanguage(lng)}
          className={cn(
            "text-xs px-1.5 py-0.5 rounded-[var(--radius-xs)] transition-colors",
            i18n.language === lng
              ? "text-[var(--color-text)] bg-[var(--color-surface-hover)]"
              : "text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
          )}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
