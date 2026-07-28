import { useState } from "react";
import { Download, Loader2, FileDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { GameItem } from "./GameItem";
import { DropZone } from "./DropZone";
import {
  fetchForwarderTemplate,
  convertToCIA,
  isTauri,
} from "@/lib/forwarderService";
import * as HexUtils from "@/lib/hexUtils";
import { useSettingsStore } from "@/store/settingsStore";
import type { ForwarderCard, NDSEntry, NDSFileData } from "@/types";
import { NDSFile } from "@/lib/ndsFile";

interface GameListProps {
  cardList: ForwarderCard[];
}

interface PatchedNDS {
  bytes: number[];
  name: string;
}

async function buildPatchedNDS(
  entry: NDSEntry,
  cardSetup: ForwarderCard,
  selectedTarget: string
): Promise<PatchedNDS | null> {
  const ndsFile = new NDSFile(entry.file, () => {});
  ndsFile.cardMode = await ndsFile.getCardMode();

  try {
    const templateBytes = await fetchForwarderTemplate(selectedTarget);

    const romHeader = await ndsFile.getBytesFromFile(0x0, 0x12);
    for (let i = 0; i < romHeader.length; i++) templateBytes[i] = romHeader[i];

    const gameTitle = await ndsFile.getFullGameTitleBytes();
    for (let i = 0; i < gameTitle.length; i++) templateBytes[i] = gameTitle[i];

    const tid = entry.data.overrideTid || entry.data.tid || "";
    const tidBytes = HexUtils.getBytesFromWord(tid);
    let c = 0;
    for (let i = 0x0c; i < 0x0c + 0x4; i++) {
      templateBytes[i] = tidBytes[c] ?? 0;
      c++;
    }
    const reverseTID = HexUtils.reverseArray(tidBytes);
    let counter = 0;
    for (let i = 0x230; i < 0x230 + 0x4; i++) {
      templateBytes[i] = reverseTID[counter] ?? 0;
      counter++;
    }

    await ndsFile.writeBanner(templateBytes, cardSetup);

    ndsFile.gamePath = entry.data.gamePath || ndsFile.gamePath;
    ndsFile.writeGamePath(
      templateBytes,
      Number(cardSetup.gamepath_location),
      Number(cardSetup.gamepath_length)
    );

    NDSFile.calculateHeaderCRC16(templateBytes);

    const baseName = entry.file.name
      .replace(/\.nds$/i, "")
      .replace(/\.dsi$/i, "");

    ndsFile.kill();
    return { bytes: templateBytes, name: `${baseName}_forwarder` };
  } catch (err) {
    console.error(err);
    ndsFile.kill();
    return null;
  }
}

export function GameList({ cardList }: GameListProps) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<NDSEntry[]>([]);
  const [savingCIA, setSavingCIA] = useState(false);
  const [savingNDS, setSavingNDS] = useState(false);
  const { selectedTarget } = useSettingsStore();

  const handleFiles = (files: File[]) => {
    const newEntries: NDSEntry[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      data: { name: file.name },
    }));
    setEntries((prev) => [...prev, ...newEntries]);
  };

  const handleRemove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdate = (id: string, data: Partial<NDSFileData>) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, ...data } } : e
      )
    );
  };

  const findCard = (cardId: string): ForwarderCard | null =>
    cardList.find((c) => c.id === cardId) ?? null;

  const preflightCheck = (): ForwarderCard | null => {
    if (!selectedTarget) {
      toast.error(t("game_list.no_target"));
      return null;
    }
    if (entries.length === 0) {
      toast.warning(t("game_list.no_roms"));
      return null;
    }
    const card = findCard(selectedTarget);
    if (!card) {
      toast.error(t("game_list.card_not_found"));
      return null;
    }
    return card;
  };

  const handleDownloadNDS = async () => {
    const card = preflightCheck();
    if (!card) return;

    setSavingNDS(true);
    const toastId = toast.loading(t("game_list.generating_nds"), { duration: Infinity });

    try {
      const results = await Promise.all(
        entries.map((e) => buildPatchedNDS(e, card, selectedTarget!))
      );
      const valid = results.filter((r): r is PatchedNDS => r !== null);

      toast.dismiss(toastId);

      if (valid.length === 0) {
        toast.error(t("game_list.generation_failed"));
        return;
      }

      const makeBlob = (bytes: number[]) => {
        const arr = new Uint8Array(bytes);
        return new Blob([arr], { type: "application/octet-stream" });
      };

      if (valid.length === 1) {
        saveAs(makeBlob(valid[0].bytes), `${valid[0].name}.nds`);
        toast.success(t("game_list.done"));
      } else {
        const zip = new JSZip();
        for (const item of valid) {
          zip.file(`${item.name}.nds`, makeBlob(item.bytes));
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, `forwarders_nds_${Date.now()}.zip`);
        toast.success(t("game_list.nds_ready", { count: valid.length }));
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error(t("game_list.unexpected_error"));
    } finally {
      setSavingNDS(false);
    }
  };

  const handleDownloadCIA = async () => {
    const card = preflightCheck();
    if (!card) return;

    setSavingCIA(true);
    const toastId = toast.loading(t("game_list.converting_cia"), { duration: Infinity });

    try {
      const results = await Promise.all(
        entries.map((e) => buildPatchedNDS(e, card, selectedTarget!))
      );
      const patches = results.filter((r): r is PatchedNDS => r !== null);

      if (patches.length === 0) {
        toast.dismiss(toastId);
        toast.error(t("game_list.template_failed"));
        return;
      }

      const ciaResults = await Promise.allSettled(
        patches.map(async (p) => {
          const res = await convertToCIA(p.bytes, p.name + ".nds");
          if (!res.success) throw new Error(res.error ?? t("game_list.cia_error"));
          return { bytes: res.ciaBytes, name: p.name };
        })
      );

      toast.dismiss(toastId);

      const valid: { bytes: Uint8Array; name: string }[] = [];
      let failCount = 0;
      for (const r of ciaResults) {
        if (r.status === "fulfilled") valid.push(r.value);
        else failCount++;
      }

      if (valid.length === 0) {
        const firstErr = ciaResults.find(r => r.status === "rejected") as PromiseRejectedResult | undefined;
        const detail = firstErr?.reason?.message ?? firstErr?.reason ?? "";
        toast.error(detail ? t("game_list.cia_error_detail", { detail }) : t("game_list.cia_conversion_failed"));
        return;
      }

      if (failCount > 0)
        toast.warning(t("game_list.cia_partial", { failCount, validCount: valid.length }));

      if (isTauri()) {
        try {
          const { save } = await import("@tauri-apps/plugin-dialog");
          const { writeFile } = await import("@tauri-apps/plugin-fs");

          if (valid.length === 1) {
            const path = await save({
              defaultPath: `${valid[0].name}.cia`,
              filters: [{ name: "CIA 3DS", extensions: ["cia"] }],
            });
            if (path) {
              await writeFile(path, valid[0].bytes);
              toast.success(t("game_list.cia_saved"));
            }
          } else {
            const zip = new JSZip();
            for (const v of valid) zip.file(`${v.name}.cia`, v.bytes);
            const blob = await zip.generateAsync({ type: "uint8array" });
            const path = await save({
              defaultPath: `forwarders_${Date.now()}.zip`,
              filters: [{ name: "Archive ZIP", extensions: ["zip"] }],
            });
            if (path) {
              await writeFile(path, blob);
              toast.success(t("game_list.cia_archived", { count: valid.length }));
            }
          }
        } catch (e) {
          toast.error(t("game_list.save_error", { message: e instanceof Error ? e.message : e }));
        }
      } else {
        if (valid.length === 1) {
          const blob = new Blob([valid[0].bytes], { type: "application/octet-stream" });
          saveAs(blob, `${valid[0].name}.cia`);
          toast.success(t("game_list.cia_ready"));
        } else {
          const zip = new JSZip();
          for (const v of valid) zip.file(`${v.name}.cia`, v.bytes);
          const blob = await zip.generateAsync({ type: "blob" });
          saveAs(blob, `forwarders_${Date.now()}.zip`);
          toast.success(t("game_list.cia_archived", { count: valid.length }));
        }
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error(t("game_list.unexpected_error"));
    } finally {
      setSavingCIA(false);
    }
  };

  const isSaving = savingCIA || savingNDS;

  return (
    <div className="flex-1 flex flex-col gap-3 p-5 overflow-y-auto">
      {entries.length === 0 && <DropZone onFiles={handleFiles} />}

      {entries.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <p className="text-xs text-[var(--color-text-muted)] flex-1">
              {t("game_list.rom_count", { count: entries.length })}
            </p>
            <label className="text-xs text-[var(--color-accent-text)] hover:underline cursor-pointer">
              <input
                type="file"
                accept=".nds,.dsi"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (!e.target.files) return;
                  handleFiles(Array.from(e.target.files));
                  e.target.value = "";
                }}
              />
              {t("game_list.add")}
            </label>
          </div>

          <div className="space-y-1.5">
            {entries.map((entry) => (
              <GameItem
                key={entry.id}
                entry={entry}
                onRemove={handleRemove}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </>
      )}

      {entries.length > 0 && (
        <div className="space-y-1.5 pt-3">
          {isTauri() ? (
            <p className="text-xs text-[var(--color-text-subtle)]">
              {t("game_list.mode_tauri")}
            </p>
          ) : (
            <p className="text-xs text-[var(--color-text-subtle)]">
              {t("game_list.mode_web")} <code className="font-mono">cd back && npm run dev</code>
            </p>
          )}

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleDownloadCIA}
            disabled={isSaving || !selectedTarget}
          >
            {savingCIA ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {savingCIA ? t("game_list.converting") : t("game_list.cia_button", { count: entries.length })}
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2 text-xs"
            onClick={handleDownloadNDS}
            disabled={isSaving || !selectedTarget}
          >
            {savingNDS ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {savingNDS ? t("game_list.generating") : t("game_list.nds_button")}
          </Button>
        </div>
      )}
    </div>
  );
}
