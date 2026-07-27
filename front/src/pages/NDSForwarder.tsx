import { useEffect, useState } from "react";
import { Gamepad2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { GameList } from "@/components/tools/nds-forwarder/GameList";
import { SettingsPanel } from "@/components/tools/nds-forwarder/SettingsPanel";
import { fetchForwarderList, fetchForwarderCard, isTauri } from "@/lib/forwarderService";
import { Badge } from "@/components/ui/badge";
import type { ForwarderCard } from "@/types";

export default function NDSForwarderPage() {
  const [cardList, setCardList] = useState<ForwarderCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCards() {
      try {
        const idList = await fetchForwarderList();
        if (!idList.length) throw new Error("Liste de cartes vide");

        const cards: ForwarderCard[] = [];
        await Promise.all(
          idList.map(async (id) => {
            const card = await fetchForwarderCard(id);
            if (card && !cancelled) {
              cards.push(card);
              // Incremental update — show cards as they arrive
              setCardList([...cards]);
            }
          })
        );

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          const msg = isTauri()
            ? "Erreur de lecture des ressources locales (templates manquants ?)."
            : "Impossible de charger les cartes forwarder. Vérifie que le backend tourne sur :3001.";
          setError(msg);
          setLoading(false);
          toast.error(msg);
        }
      }
    }

    loadCards();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Tool header */}
      <div className="page-enter flex items-center gap-3 px-6 py-4 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-accent-muted)]">
          <Gamepad2 className="w-4 h-4 text-[var(--color-accent-text)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[var(--color-text)]">
              NDS Forwarder
            </h1>
            <Badge variant="secondary" className="text-[10px]">
              v2
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-subtle)]">
            Génère des CIA forwarders pour lancer tes ROMs NDS depuis le menu 3DS
          </p>
        </div>

        {/* Cards status */}
        <div className="flex items-center gap-2 shrink-0">
          {loading ? (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-subtle)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Chargement des cartes... ({cardList.length})
            </div>
          ) : error ? (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-danger)]">
              <AlertCircle className="w-3.5 h-3.5" />
              Erreur cartes
            </div>
          ) : (
            <Badge variant="success" className="text-[10px]">
              {cardList.length} cartes chargées
            </Badge>
          )}
        </div>


      </div>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        <GameList cardList={cardList} />
        <SettingsPanel cardList={cardList} />
      </div>
    </div>
  );
}
