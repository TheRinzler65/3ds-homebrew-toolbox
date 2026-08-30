import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguagePicker } from "@/components/LanguagePicker";

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="flex flex-col w-[260px] min-h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] shrink-0">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--color-border)]">
        <div>
          <span className="text-sm font-semibold text-[var(--color-text)] tracking-tight">
            MultiTools
          </span>
          <p className="text-[10px] text-[var(--color-text-subtle)] leading-none mt-0.5">
            {t("sidebar.subtitle")}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors",
              isActive("/")
                ? "bg-[var(--color-accent-muted)] text-[var(--color-accent-text)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
            )}
          >
            {t("sidebar.home")}
          </Link>

          <Separator className="my-2" />

          <Link
            to="/tools/nds-forwarder"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors",
              isActive("/tools/nds-forwarder")
                ? "bg-[var(--color-accent-muted)] text-[var(--color-accent-text)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
            )}
          >
            {t("sidebar.nds_forwarder")}
          </Link>

          <Link
            to="/tools/rom-manager"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors",
              isActive("/tools/rom-manager")
                ? "bg-[var(--color-accent-muted)] text-[var(--color-accent-text)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
            )}
          >
            {t("sidebar.rom_manager")}
          </Link>
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-[var(--color-border)] flex items-center justify-between">
        <a
          href="https://github.com/olmectron"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)] transition-colors rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-hover)]"
        >
          olmectron
        </a>
        <ThemeToggle />
      </div>

      <div className="px-3 pb-3 border-t border-[var(--color-border)] pt-2">
        <LanguagePicker />
      </div>
    </aside>
  );
}
