# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build TypeScript
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Image finale
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim

WORKDIR /app

# Copier le binaire make_cia Linux (extrait du JAR Olmectron Forwarder3DS)
# CTR_Toolkit v6.4 by 3DSGuy — supporte --srl= pour les ROMs DSi
COPY make_cia_linux ./make_cia_linux
RUN chmod +x ./make_cia_linux

# Dépendances Node.js production
COPY package*.json ./
RUN npm ci --omit=dev

# Code compilé
COPY --from=builder /app/dist ./dist

ENV PORT=3001
ENV HOST=0.0.0.0
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s \
  CMD node -e "fetch('http://localhost:3001/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
