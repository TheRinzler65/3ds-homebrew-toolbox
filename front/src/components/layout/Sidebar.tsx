import { Link, useLocation } from "react-router-dom";
import { Gamepad2, Home, Layers, ExternalLink, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccentPicker } from "@/components/AccentPicker";

const TOOLS = [
  {
    id: "nds-forwarder",
    name: "NDS Forwarder",
    description: "Génère des CIA forwarders pour 3DS",
    icon: Gamepad2,
    path: "/tools/nds-forwarder",
    category: "Nintendo",
  },
];

const CATEGORIES = [...new Set(TOOLS.map((t) => t.category))];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex flex-col w-[260px] min-h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-accent)]">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-semibold text-[var(--color-text)] tracking-tight">
            MultiTools
          </span>
          <p className="text-[10px] text-[var(--color-text-subtle)] leading-none mt-0.5">
            Homebrew Toolbox
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          {/* Home */}
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors",
              location.pathname === "/"
                ? "bg-[var(--color-accent-muted)] text-[var(--color-accent-text)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
            )}
          >
            <Home className="w-4 h-4 shrink-0" />
            Accueil
          </Link>

          <Separator className="my-2" />

          {/* Tool categories */}
          {CATEGORIES.map((category) => (
            <div key={category} className="space-y-0.5">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-subtle)]">
                {category}
              </p>
              {TOOLS.filter((t) => t.category === category).map((tool) => {
                const Icon = tool.icon;
                const isActive = location.pathname === tool.path;
                return (
                  <Link
                    key={tool.id}
                    to={tool.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors group",
                      isActive
                        ? "bg-[var(--color-accent-muted)] text-[var(--color-accent-text)]"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive
                          ? "text-[var(--color-accent-text)]"
                          : "text-[var(--color-text-subtle)] group-hover:text-[var(--color-text-muted)]"
                      )}
                    />
                    <span className="truncate">{tool.name}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          <Separator className="my-2" />

          {/* More tools placeholder */}
          <div className="px-3 py-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--color-text-subtle)]" />
            <span className="text-xs text-[var(--color-text-subtle)]">
              Plus d'outils bientôt...
            </span>
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--color-border)] space-y-2">
        <div className="flex items-center justify-between">
          <a
            href="https://github.com/olmectron"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)] transition-colors rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-hover)]"
          >
            <ExternalLink className="w-3 h-3" />
            Olmectron
          </a>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] text-[var(--color-text-subtle)] font-medium">Theme</span>
          <AccentPicker />
        </div>
      </div>
    </aside>
  );
}
