import { useState } from "react";
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
    toast.success("Dossier mis à jour.");
  };

  return (
    <aside className="w-64 shrink-0 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-sm font-semibold text-[var(--color-text)]">
          Paramètres
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Carte cible</Label>
          <Select
            value={selectedTarget ?? ""}
            onValueChange={(val) => setSelectedTarget(val || null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir..." />
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
              Obligatoire pour générer.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-xs">Options</Label>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text)]">TID aléatoire</p>
            <Switch
              checked={autoRandomTid}
              onCheckedChange={setAutoRandomTid}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text)]">Chemin auto</p>
            <Switch
              checked={setRomPath}
              onCheckedChange={setSetRomPath}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text)]">Garder .nds</p>
            <Switch
              checked={keepNds}
              onCheckedChange={setKeepNds}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Dossier jeux (SD)</Label>
          <div className="flex gap-1.5">
            <Input
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              className="font-mono text-xs"
              placeholder="Games/NDS"
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
