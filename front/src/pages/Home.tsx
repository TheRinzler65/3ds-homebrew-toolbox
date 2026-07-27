import { Link } from "react-router-dom";
import { Gamepad2, ArrowRight, Wrench, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TOOLS = [
  {
    id: "nds-forwarder",
    name: "NDS Forwarder",
    description:
      "Génère des CIA forwarders pour lancer tes ROMs NDS/DSi directement depuis le menu Home de ta 3DS, sans flashcard.",
    icon: Gamepad2,
    path: "/tools/nds-forwarder",
    category: "Nintendo",
    badge: "3DS",
    color: "from-indigo-600/20 to-purple-600/10",
    border: "hover:border-indigo-500/40",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero */}
      <div className="px-10 py-16 border-b border-[var(--color-border)]">
        <div className="max-w-2xl page-enter">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent)]">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-[var(--color-text)] tracking-tight">
                MultiTools
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-[var(--color-text)] leading-tight mb-3">
            Ta boîte à outils{" "}
            <span className="text-[var(--color-accent-text)]">homebrew</span>
          </h1>
          <p className="text-base text-[var(--color-text-muted)] leading-relaxed max-w-xl">
            Des outils pour simplifier tes projets Nintendo homebrew — tout
            dans un seul endroit.
          </p>
        </div>
      </div>

      {/* Tool grid */}
      <div className="px-10 py-10 flex-1">
        <div className="flex items-center gap-3 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-subtle)]">
            Outils disponibles
          </p>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          <Badge variant="secondary">{TOOLS.length} outil{TOOLS.length > 1 ? "s" : ""}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                to={tool.path}
                className={`card-hover group flex flex-col gap-4 p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-gradient-to-br ${tool.color} ${tool.border} hover:shadow-lg hover:bg-[var(--color-surface-hover)]`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-raised)]">
                    <Icon className="w-5 h-5 text-[var(--color-accent-text)]" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {tool.badge}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent-text)] transition-colors">
                    {tool.name}
                  </h2>
                  <p className="text-xs text-[var(--color-text-subtle)] leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[var(--color-accent-text)] mt-auto">
                  Ouvrir l'outil
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}

          {/* Placeholder */}
          <div className="card-hover flex flex-col items-center justify-center gap-3 p-5 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] text-center hover:border-[var(--color-text-subtle)]/30">
            <div className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-raised)]">
              <Sparkles className="w-5 h-5 text-[var(--color-text-subtle)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-subtle)]">
                Prochain outil
              </p>
              <p className="text-xs text-[var(--color-text-subtle)]/60 mt-0.5">
                Bientôt disponible
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-10 py-5 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-subtle)]">
          Basé sur les travaux d'{" "}
          <a
            href="https://github.com/olmectron"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent-text)] hover:underline"
          >
            Olmectron
          </a>
          {" "}et{" "}
          <a
            href="https://github.com/RocketRobz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent-text)] hover:underline"
          >
            RocketRobz
          </a>
        </p>
      </div>
    </div>
  );
}
