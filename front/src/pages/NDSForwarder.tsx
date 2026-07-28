import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GameList } from "@/components/tools/nds-forwarder/GameList";
import { SettingsPanel } from "@/components/tools/nds-forwarder/SettingsPanel";
import { fetchForwarderList, fetchForwarderCard, isTauri } from "@/lib/forwarderService";
import type { ForwarderCard } from "@/types";

export default function NDSForwarderPage() {
  const { t } = useTranslation();
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
          setError(isTauri() ? t("nds_forwarder.error_tauri") : t("nds_forwarder.error_web"));
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
            {t("nds_forwarder.subtitle")}
          </p>
        </div>

        <div className="ml-auto text-xs">
          {loading ? (
            <span className="text-[var(--color-text-subtle)] flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t("nds_forwarder.loading_cards")}
            </span>
          ) : error ? (
            <span className="text-[var(--color-danger)]">{error}</span>
          ) : (
            <span className="text-[var(--color-text-subtle)]">
              {t("nds_forwarder.card_count", { count: cardList.length })}
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
