import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { GameList } from "@/components/tools/nds-forwarder/GameList";
import { SettingsPanel } from "@/components/tools/nds-forwarder/SettingsPanel";
import { fetchForwarderList, fetchForwarderCard, isTauri } from "@/lib/forwarderService";
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
        if (!idList.length) throw new Error("empty card list");

        const cards: ForwarderCard[] = [];
        await Promise.all(
          idList.map(async (id) => {
            const card = await fetchForwarderCard(id);
            if (card && !cancelled) {
              cards.push(card);
              setCardList([...cards]);
            }
          })
        );

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          const msg = isTauri()
            ? "Ressources locales introuvables (templates manquants ?)."
            : "Backend inaccessible. Vérifie que le serveur tourne sur :3001.";
          setError(msg);
          setLoading(false);
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
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-border)] shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-[var(--color-text)]">
            NDS Forwarder
          </h1>
          <p className="text-xs text-[var(--color-text-subtle)]">
            Des ROMs .nds ou .dsi vers un .cia pour 3DS.
          </p>
        </div>

        <div className="ml-auto text-xs">
          {loading ? (
            <span className="text-[var(--color-text-subtle)] flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              cartes...
            </span>
          ) : error ? (
            <span className="text-[var(--color-danger)]">{error}</span>
          ) : (
            <span className="text-[var(--color-text-subtle)]">
              {cardList.length} carte{cardList.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <GameList cardList={cardList} />
        <SettingsPanel cardList={cardList} />
      </div>
    </div>
  );
}
