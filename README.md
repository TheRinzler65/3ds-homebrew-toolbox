# MultiTools — Homebrew Toolbox

Site multi-outil pour tes projets Nintendo homebrew.

## Stack

- **React 19** + **TypeScript**
- **Tailwind CSS v4** (config CSS, pas de `tailwind.config.js`)
- **shadcn/ui** (composants Radix UI)
- **Zustand** (état global + persistance localStorage)
- **React Router v7**
- **Sonner** (toasts)
- **JSZip** + **file-saver** (téléchargements)
- **Vite 6**

## Installation & dev

```bash
npm install
npm run dev
```

Le proxy Vite gère automatiquement le CORS en développement :
- `/api/makecia` → `https://us-central1-forwarder3ds.cloudfunctions.net/execMakeCia`
- `/api/forwarders/` → `https://olmectron.github.io/forwarders/`

## Build production

```bash
npm run build
# → dist/
```

## Config Nginx (production)

Dans ton Nginx Proxy Manager ou `nginx.conf`, ajoute ces blocs dans le `server {}` de ton site :

```nginx
# Proxy CIA conversion (Firebase)
location /api/makecia {
    proxy_pass https://us-central1-forwarder3ds.cloudfunctions.net/execMakeCia;
    proxy_http_version 1.1;
    proxy_set_header Host us-central1-forwarder3ds.cloudfunctions.net;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_ssl_server_name on;
}

# Proxy templates forwarder (Olmectron GitHub Pages)
location /api/forwarders/ {
    proxy_pass https://olmectron.github.io/forwarders/;
    proxy_http_version 1.1;
    proxy_set_header Host olmectron.github.io;
    proxy_ssl_server_name on;
}

# SPA fallback — React Router
location / {
    try_files $uri $uri/ /index.html;
}
```

### NPM (Nginx Proxy Manager) — Advanced tab

Colle ça dans "Custom Nginx Configuration" :

```nginx
location /api/makecia {
    proxy_pass https://us-central1-forwarder3ds.cloudfunctions.net/execMakeCia;
    proxy_set_header Host us-central1-forwarder3ds.cloudfunctions.net;
    proxy_ssl_server_name on;
}

location /api/forwarders/ {
    proxy_pass https://olmectron.github.io/forwarders/;
    proxy_set_header Host olmectron.github.io;
    proxy_ssl_server_name on;
}
```

## Structure

```
src/
├── lib/
│   ├── crc16.ts              # CRC16-ARC (= js-crc)
│   ├── hexUtils.ts           # Utilitaires hex
│   ├── ndsFile.ts            # Lecture ROM NDS (header, icône, banner)
│   ├── miscUtils.ts          # Divers
│   ├── tidList.ts            # TIDs NDS valides
│   └── forwarderService.ts   # API Olmectron + Firebase (via proxy)
├── store/
│   └── settingsStore.ts      # Zustand + localStorage
├── components/
│   ├── ui/                   # Button, Input, Select, Switch, Badge…
│   ├── layout/               # Sidebar, AppLayout
│   └── tools/nds-forwarder/
│       ├── GameList.tsx      # Liste ROMs + download batch
│       ├── GameItem.tsx      # Carte expandable + icône canvas
│       ├── DropZone.tsx      # Drag & drop
│       ├── SettingsPanel.tsx # Paramètres (target, TID, dossier)
│       └── MakeCiaTool.tsx   # Conversion directe NDS → CIA
└── pages/
    ├── Home.tsx              # Grille d'outils
    └── NDSForwarder.tsx      # Page outil principal
```

## Ajouter un outil

1. Crée `src/pages/MonOutil.tsx`
2. Ajoute la route dans `src/App.tsx`
3. Ajoute l'entrée dans `TOOLS[]` dans `src/components/layout/Sidebar.tsx` et `src/pages/Home.tsx`
