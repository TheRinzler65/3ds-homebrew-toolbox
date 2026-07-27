#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# nds_to_cia.sh — Convertit les .nds forwarder patchés en .cia
#
# Prérequis : makerom (https://github.com/3DSGuy/Project_CTR/releases)
#             Télécharge la version pour ton OS et mets le binaire dans PATH
#             ou dans le même dossier que ce script.
#
# Usage :
#   chmod +x nds_to_cia.sh
#   ./nds_to_cia.sh <fichier.nds>         # converti un fichier
#   ./nds_to_cia.sh *.nds                 # converti tous les .nds du dossier
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <forwarder.nds> [forwarder2.nds ...]"
  exit 1
fi

MAKEROM="${MAKEROM:-makerom}"

if ! command -v "$MAKEROM" &>/dev/null; then
  echo "❌  makerom introuvable. Télécharge-le depuis :"
  echo "    https://github.com/3DSGuy/Project_CTR/releases"
  echo "    et place le binaire dans ton PATH ou dans ce dossier."
  exit 1
fi

for NDS in "$@"; do
  if [[ ! -f "$NDS" ]]; then
    echo "⚠  Fichier introuvable : $NDS"
    continue
  fi

  BASE="${NDS%.nds}"
  CIA="${BASE}.cia"

  echo "🔄  Conversion : $NDS → $CIA"
  "$MAKEROM" -f cia -o "$CIA" -content "$NDS":0:0

  if [[ -f "$CIA" ]]; then
    echo "✅  $CIA généré ($(du -h "$CIA" | cut -f1))"
  else
    echo "❌  Échec pour $NDS"
  fi
done

echo ""
echo "Installe les .cia via FBI sur ta 3DS."
