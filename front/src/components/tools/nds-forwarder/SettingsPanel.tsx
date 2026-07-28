import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/store/settingsStore";
import type { ForwarderCard } from "@/types";

interface SettingsPanelProps {
  cardList: ForwarderCard[];
}

export function SettingsPanel({ cardList }: SettingsPanelProps) {
  const { t } = useTranslation();
  const {
    selectedTarget,
    autoRandomTid,
    keepNds,
    setRomPath,
    folderForGames,
    setSelectedTarget,
    setAutoRandomTid,
    setKeepNds,
    setSetRomPath,
    setFolderForGames,
  } = useSettingsStore();

  const [folderInput, setFolderInput] = useState(folderForGames);

  const sortedCards = [...cardList].sort((a, b) =>
    (a.name || "zzz").toLowerCase().localeCompare((b.name || "zzz").toLowerCase())
  );

  const handleSaveFolder = () => {
    setFolderForGames(folderInput);
    toast.success(t("settings.folder_updated"));
  };

  return (
    <aside className="w-64 shrink-0 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {t("settings.title")}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("settings.target_card")}</Label>
          <Select
            value={selectedTarget ?? ""}
            onValueChange={(val) => setSelectedTarget(val || null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("settings.choose")} />
            </SelectTrigger>
            <SelectContent>
              {sortedCards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name || card.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectedTarget && (
            <p className="text-xs text-[var(--color-text-subtle)]">
              {t("settings.required")}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-xs">{t("settings.options")}</Label>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text)]">{t("settings.random_tid")}</p>
            <Switch
              checked={autoRandomTid}
              onCheckedChange={setAutoRandomTid}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text)]">{t("settings.auto_path")}</p>
            <Switch
              checked={setRomPath}
              onCheckedChange={setSetRomPath}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text)]">{t("settings.keep_nds")}</p>
            <Switch
              checked={keepNds}
              onCheckedChange={setKeepNds}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("settings.games_folder")}</Label>
          <div className="flex gap-1.5">
            <Input
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              className="font-mono text-xs"
              placeholder={t("settings.folder_placeholder")}
            />
            <Button size="icon" variant="outline" onClick={handleSaveFolder}>
              <Save className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
