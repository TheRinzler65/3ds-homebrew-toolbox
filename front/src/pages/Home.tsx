import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 py-12 border-b border-[var(--color-border)]">
        <h1 className="text-[28px] font-bold text-[var(--color-text)] leading-tight mb-2">
          MultiTools
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Des outils pour projets homebrew Nintendo. Pour l'instant un seul,
          d'autres viendront peut-être.
        </p>
      </div>

      <div className="px-8 py-8 flex-1">
        <Link
          to="/tools/nds-forwarder"
          className="group block p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent-text)] transition-colors">
              NDS Forwarder
            </h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-2">
            Génère des CIA forwarders pour lancer des ROMs NDS depuis le menu
            Home de ta 3DS.
          </p>
          <span className="text-xs text-[var(--color-accent-text)]">
            Lancer &rarr;
          </span>
        </Link>
      </div>

      <div className="px-8 py-4 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-subtle)]">
          Basé sur les travaux d'olmectron et RocketRobz.
        </p>
      </div>
    </div>
  );
}
