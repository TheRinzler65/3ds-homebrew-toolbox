# Backend — CIA Converter

Mini serveur Fastify qui reçoit un template NDS patché, lance `makerom`, et renvoie le fichier CIA.

Remplace le service Firebase `execMakeCia` (mort).

---

## Développement local

### 1. Télécharge makerom pour ton OS

Depuis https://github.com/3DSGuy/Project_CTR/releases/tag/v0.19.0

| OS | Fichier à télécharger |
|----|-----------------------|
| macOS ARM (M1/M2/M3) | `makerom-v0.19.0-macos_arm64.zip` |
| macOS Intel | `makerom-v0.19.0-macos_x86_64.zip` |
| Linux x86_64 | `makerom-v0.19.0-ubuntu_x86_64.zip` |
| Windows | `makerom-v0.19.0-win_x86_64.zip` |

### 2. Place le binaire dans ce dossier

```
backend/
  makerom          ← ici (macOS/Linux)
  makerom.exe      ← ici (Windows)
  src/
  package.json
  ...
```

Ou ajoute-le à ton PATH, ou définis `MAKEROM_PATH=/chemin/vers/makerom`.

### 3. Lance le backend

```bash
cd backend
npm install
npm run dev
# → http://localhost:3001
```

### 4. Lance le frontend (autre terminal)

```bash
# racine du projet
npm run dev
# → http://localhost:5173
# Le proxy Vite redirige /api/makecia → localhost:3001
```

---

## Production — Coolify

### Option A : image Docker Coolify (recommandée)

Dans Coolify, crée un service **Docker** pointant sur `backend/` :

- **Build context** : `./backend`
- **Dockerfile** : `./backend/Dockerfile`
- **Port** : `3001`
- **Pas de variables d'env** nécessaires (makerom est téléchargé au build)

Le Dockerfile télécharge automatiquement `makerom v0.19.0` ubuntu_x86_64.

### Option B : docker-compose (test local)

```bash
cd backend
docker build -t multitools-backend .
docker run -d -p 3001:3001 --name cia-backend multitools-backend
```

---

## Config Nginx (Nginx Proxy Manager)

Dans ton proxy host pour le frontend, onglet **Advanced** :

```nginx
# CIA conversion → backend Coolify
location /api/makecia {
    proxy_pass http://<IP_BACKEND>:3001/api/makecia;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_read_timeout 120s;
    client_max_body_size 32m;
}

# Templates forwarder → Olmectron
location /api/forwarders/ {
    proxy_pass https://olmectron.github.io/forwarders/;
    proxy_http_version 1.1;
    proxy_set_header Host olmectron.github.io;
    proxy_ssl_server_name on;
}

# SPA fallback
location / {
    try_files $uri $uri/ /index.html;
}
```

Remplace `<IP_BACKEND>` par l'IP du conteneur backend dans ton réseau Coolify
(ex: `192.168.88.15` si c'est sur la même VM).

---

## Vérification

```bash
curl http://localhost:3001/health
# → {"ok":true,"makerom":"/path/to/makerom"}
```
