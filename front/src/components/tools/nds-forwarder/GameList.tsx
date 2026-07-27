import { useState } from "react";
import { Download, Loader2, FileDown, AlertTriangle, Plus } from "lucide-react";
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

// ─── Helper: construit le NDS template patché (100% local, pas de Firebase) ──

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

    // Header ROM (0x00–0x11)
    const romHeader = await ndsFile.getBytesFromFile(0x0, 0x12);
    for (let i = 0; i < romHeader.length; i++) templateBytes[i] = romHeader[i];

    // Game title bytes (0x00–0x0B)
    const gameTitle = await ndsFile.getFullGameTitleBytes();
    for (let i = 0; i < gameTitle.length; i++) templateBytes[i] = gameTitle[i];

    // TID bytes (0x0C–0x0F) + reversed at 0x230
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

    // Banner (icône + palette depuis la ROM)
    await ndsFile.writeBanner(templateBytes, cardSetup);

    // Chemin ROM sur la SD
    ndsFile.gamePath = entry.data.gamePath || ndsFile.gamePath;
    ndsFile.writeGamePath(
      templateBytes,
      Number(cardSetup.gamepath_location),
      Number(cardSetup.gamepath_length)
    );

    // Calculate header CRC16 before finalizing
    NDSFile.calculateHeaderCRC16(templateBytes);

    const baseName = entry.file.name
      .replace(/\.nds$/i, "")
      .replace(/\.dsi$/i, "");

    ndsFile.kill();
    return { bytes: templateBytes, name: `${baseName}_forwarder` };
  } catch (err) {
    console.error("Erreur build NDS:", err);
    ndsFile.kill();
    return null;
  }
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function GameList({ cardList }: GameListProps) {
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
    toast.success("ROM retirée");
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

  // ── Validation commune ────────────────────────────────────────────────────
  const preflightCheck = (): ForwarderCard | null => {
    if (!selectedTarget) {
      toast.error("Sélectionne une carte cible dans les paramètres →");
      return null;
    }
    if (entries.length === 0) {
      toast.warning("Aucune ROM dans la liste");
      return null;
    }
    const card = findCard(selectedTarget);
    if (!card) {
      toast.error("Carte introuvable — recharge la page");
      return null;
    }
    return card;
  };

  // ── Télécharger les .nds patchés (toujours local, aucune dépendance Firebase) ─
  const handleDownloadNDS = async () => {
    const card = preflightCheck();
    if (!card) return;

    setSavingNDS(true);
    const toastId = toast.loading("Génération des templates .nds...", {
      duration: Infinity,
    });

    try {
      const results = await Promise.all(
        entries.map((e) => buildPatchedNDS(e, card, selectedTarget!))
      );
      const valid = results.filter((r): r is PatchedNDS => r !== null);

      toast.dismiss(toastId);

      if (valid.length === 0) {
        toast.error("Échec de la génération. Vérifie les ROMs.");
        return;
      }

      const makeBlob = (bytes: number[]) => {
        const arr = new Uint8Array(bytes);
        return new Blob([arr], { type: "application/octet-stream" });
      };

      if (valid.length === 1) {
        saveAs(makeBlob(valid[0].bytes), `${valid[0].name}.nds`);
        toast.success("Template .nds téléchargé !");
      } else {
        const zip = new JSZip();
        for (const item of valid) {
          zip.file(`${item.name}.nds`, makeBlob(item.bytes));
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, `forwarders_nds_${Date.now()}.zip`);
        toast.success(`${valid.length} templates .nds téléchargés !`);
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error("Erreur inattendue.");
    } finally {
      setSavingNDS(false);
    }
  };

  // ── Générer CIA ────────────────────────────────────────────────────────────
  const handleDownloadCIA = async () => {
    const card = preflightCheck();
    if (!card) return;

    setSavingCIA(true);
    const toastId = toast.loading("Conversion CIA...", {
      duration: Infinity,
    });

    try {
      const results = await Promise.all(
        entries.map((e) => buildPatchedNDS(e, card, selectedTarget!))
      );
      const patches = results.filter((r): r is PatchedNDS => r !== null);

      if (patches.length === 0) {
        toast.dismiss(toastId);
        toast.error("Impossible de générer les templates NDS.");
        return;
      }

      // Convertit chaque template patché en CIA
      const ciaResults = await Promise.allSettled(
        patches.map(async (p) => {
          const res = await convertToCIA(p.bytes, p.name + ".nds");
          if (!res.success) throw new Error(res.error ?? "Erreur CIA");
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
        const prefix = isTauri() ? "Échec make_cia" : "Backend indisponible";
        toast.error(detail ? `${prefix} : ${detail}` : prefix, { duration: 10000 });
        return;
      }

      if (failCount > 0)
        toast.warning(`${failCount} forwarder(s) ont échoué. ${valid.length} CIA générés.`);

      // Sauvegarde : dialogue natif Tauri ou file-saver web
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
              toast.success("CIA enregistré !");
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
              toast.success(`${valid.length} CIA archivés !`);
            }
          }
        } catch (e) {
          toast.error(`Erreur sauvegarde : ${e instanceof Error ? e.message : e}`);
        }
      } else {
        // Web mode : file-saver
        if (valid.length === 1) {
          const blob = new Blob([valid[0].bytes], { type: "application/octet-stream" });
          saveAs(blob, `${valid[0].name}.cia`);
          toast.success("CIA généré !");
        } else {
          const zip = new JSZip();
          for (const v of valid) zip.file(`${v.name}.cia`, v.bytes);
          const blob = await zip.generateAsync({ type: "blob" });
          saveAs(blob, `forwarders_${Date.now()}.zip`);
          toast.success(`${valid.length} CIA archivés !`);
        }
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error("Erreur inattendue.");
    } finally {
      setSavingCIA(false);
    }
  };

  const isSaving = savingCIA || savingNDS;

  return (
    <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto">
      {/* Upload zone vide */}
      {entries.length === 0 && <DropZone onFiles={handleFiles} />}

      {entries.length > 0 && (
        <>
          {/* Barre du haut */}
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--color-text-muted)] flex-1">
              {entries.length} ROM{entries.length > 1 ? "s" : ""} chargée
              {entries.length > 1 ? "s" : ""}
            </p>
            <label className="cursor-pointer">
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors">
                <Plus className="w-3 h-3" />
                Ajouter
              </span>
            </label>
          </div>

          {/* Cartes ROM */}
          <div className="space-y-2">
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

      {/* Boutons sticky */}
      {entries.length > 0 && (
        <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-[var(--color-bg)] to-transparent space-y-2">

          {/* Alerte mode */}
          {isTauri() ? (
            <div className="flex items-start gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-emerald-950/40 border border-emerald-800/40 text-xs">
              <span className="text-emerald-300">
                <strong className="text-emerald-200">Mode desktop.</strong> La conversion CIA utilise{" "}
                <code className="font-mono">make_cia.exe</code> en local. Assure-toi qu'il est dans le
                même dossier que l'application.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-blue-950/40 border border-blue-800/40 text-xs">
              <span className="text-blue-300">
                <strong className="text-blue-200">Backend requis.</strong> Lance{" "}
                <code className="font-mono">cd back && npm run dev</code>
                {" "}(port 3001) pour la conversion CIA.
              </span>
            </div>
          )}

          {/* Bouton CIA (primaire, backend requis) */}
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
            {savingCIA
              ? "Conversion CIA..."
              : `Générer ${entries.length} CIA${entries.length > 1 ? "s" : ""}`}
          </Button>

          {/* Bouton NDS (fallback local, toujours dispo) */}
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2"
            onClick={handleDownloadNDS}
            disabled={isSaving || !selectedTarget}
          >
            {savingNDS ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {savingNDS
              ? "Génération .nds..."
              : `Télécharger .nds patché (local)`}
          </Button>

          {!selectedTarget && (
            <p className="text-center text-xs text-amber-400">
              ⚠ Sélectionne une carte cible dans les paramètres →
            </p>
          )}
        </div>
      )}
    </div>
  );
}
