import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 py-12 border-b border-[var(--color-border)]">
        <h1 className="text-[28px] font-bold text-[var(--color-text)] leading-tight mb-2">
          MultiTools
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          {t("home.subtitle")}
        </p>
      </div>

      <div className="px-8 py-8 flex-1">
        <Link
          to="/tools/nds-forwarder"
          className="group block p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <h2 className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent-text)] transition-colors mb-2">
            NDS Forwarder
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-2">
            {t("home.nds_description")}
          </p>
          <span className="text-xs text-[var(--color-accent-text)]">
            {t("home.start")}
          </span>
        </Link>
      </div>

      <div className="px-8 py-4 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-subtle)]">
          {t("home.footer")}
        </p>
      </div>
    </div>
  );
}
