import { useState } from "react";
import { Settings, Save, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
    toast.success("Dossier mis à jour");
  };

  return (
    <aside className="w-[280px] shrink-0 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--color-border)]">
        <Settings className="w-4 h-4 text-[var(--color-accent-text)]" />
        <span className="text-sm font-semibold text-[var(--color-text)]">
          Paramètres
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Target card */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
            Carte cible (Target)
          </Label>
          <Select
            value={selectedTarget ?? ""}
            onValueChange={(val) => setSelectedTarget(val || null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir une carte..." />
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
            <p className="text-xs text-[var(--color-warning)]">
              ⚠ Sélectionne une carte pour générer les forwarders
            </p>
          )}
        </div>

        <Separator />

        {/* Options */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
            Options
          </Label>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--color-text)]">TID aléatoire auto</p>
              <p className="text-xs text-[var(--color-text-subtle)]">
                Génère un TID random pour chaque ROM
              </p>
            </div>
            <Switch
              checked={autoRandomTid}
              onCheckedChange={setAutoRandomTid}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--color-text)]">Chemin auto</p>
              <p className="text-xs text-[var(--color-text-subtle)]">
                Utiliser le chemin absolu du fichier comme game path
              </p>
            </div>
            <Switch
              checked={setRomPath}
              onCheckedChange={setSetRomPath}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--color-text)]">Garder les .nds</p>
              <p className="text-xs text-[var(--color-text-subtle)]">
                Ne pas supprimer le fichier .nds temporaire
              </p>
            </div>
            <Switch
              checked={keepNds}
              onCheckedChange={setKeepNds}
            />
          </div>
        </div>

        <Separator />

        {/* Folder */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
            Dossier des jeux
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FolderOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-subtle)]" />
              <Input
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                className="pl-8 text-xs font-mono"
                placeholder="Games/NDS"
              />
            </div>
            <Button size="icon" variant="outline" onClick={handleSaveFolder}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-[var(--color-text-subtle)]">
            Chemin où se trouvent tes ROMs sur la carte SD
          </p>
        </div>
      </div>
    </aside>
  );
}
