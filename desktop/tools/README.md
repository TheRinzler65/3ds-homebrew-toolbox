# Convertir .nds → .cia localement

Si le service Firebase (`execMakeCia`) est indisponible, le bouton
**"Télécharger .nds patché"** te donne les templates NDS déjà patchés.
Convertis-les en CIA ici.

## Option 1 — Script shell (Linux/macOS/WSL)

### 1. Télécharge makerom

| OS | Lien |
|----|------|
| Windows | [makerom.exe](https://github.com/3DSGuy/Project_CTR/releases) |
| Linux x64 | [makerom](https://github.com/3DSGuy/Project_CTR/releases) |
| macOS | compiler depuis les sources |

### 2. Lance le script

```bash
# Un seul fichier
./nds_to_cia.sh forwarder-Pokemon.nds

# Tous les .nds du dossier
./nds_to_cia.sh *.nds
```

## Option 2 — makerom en direct

```bash
makerom -f cia -o forwarder.cia -content forwarder.nds:0:0
```

## Option 3 — Installer via FBI sans CIA

FBI peut installer directement certains NDS via le réseau ou SD.
Consulte la doc FBI pour les forwarders NDS.

## Résultat

Les `.cia` générés s'installent via **FBI** sur ta 3DS :
`FBI → SD → [ton fichier].cia → Install CIA`
