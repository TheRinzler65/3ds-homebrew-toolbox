import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] shrink-0">
      <div className="px-4 py-3.5 border-b border-[var(--color-border)]">
        <span className="text-sm font-semibold text-[var(--color-text)]">
          MultiTools
        </span>
        <p className="text-[11px] text-[var(--color-text-subtle)] mt-0.5">
          Homebrew Toolbox
        </p>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-sm transition-colors",
              location.pathname === "/"
                ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
            )}
          >
            Accueil
          </Link>

          <Separator className="my-1.5" />

          <Link
            to="/tools/nds-forwarder"
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-sm transition-colors",
              location.pathname === "/tools/nds-forwarder"
                ? "bg-[var(--color-surface-hover)] text-[var(--color-accent-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
            )}
          >
            NDS Forwarder
          </Link>
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-[var(--color-border)] flex items-center justify-between">
        <a
          href="https://github.com/olmectron"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors"
        >
          olmectron
        </a>
        <ThemeToggle />
      </div>
    </aside>
  );
}
