import { useTranslation } from "react-i18next";
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
import { useROMStore } from "@/store/romManagerStore";

export function ROMSettings() {
  const { t } = useTranslation();
  const currentDir = useROMStore((s) => s.currentDir);
  const z3dsLevel = useROMStore((s) => s.z3dsLevel);
  const deleteSource = useROMStore((s) => s.deleteSource);
  const setCurrentDir = useROMStore((s) => s.setCurrentDir);
  const setZ3dsLevel = useROMStore((s) => s.setZ3dsLevel);
  const setDeleteSource = useROMStore((s) => s.setDeleteSource);

  return (
    <aside className="w-64 shrink-0 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {t("rom_manager.settings_title")}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("rom_manager.source_dir")}</Label>
          <Input
            value={currentDir}
            onChange={(e) => setCurrentDir(e.target.value)}
            className="font-mono text-xs"
            placeholder="C:/ROMS"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("rom_manager.z3ds_level")}</Label>
          <Select value={String(z3dsLevel)} onValueChange={(v) => setZ3dsLevel(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t("rom_manager.z3ds_fast")} (L1)</SelectItem>
              <SelectItem value="3">{t("rom_manager.z3ds_balanced")} (L3)</SelectItem>
              <SelectItem value="9">{t("rom_manager.z3ds_best")} (L9)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--color-text)]">{t("rom_manager.delete_source")}</p>
          <Switch checked={deleteSource} onCheckedChange={setDeleteSource} />
        </div>
      </div>
    </aside>
  );
}
