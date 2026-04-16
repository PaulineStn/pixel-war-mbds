# ──────────────────────────────────────────────
# Stage 1 : Build du client React
# ──────────────────────────────────────────────
FROM node:22-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
# L'URL de l'API sera injectée au build via ARG
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ──────────────────────────────────────────────
# Stage 2 : Build de l'API TypeScript
# ──────────────────────────────────────────────
FROM node:22-alpine AS api-builder

WORKDIR /app/api

COPY api/package*.json ./
RUN npm ci

COPY api/ ./
RUN npm run build

# ──────────────────────────────────────────────
# Stage 3 : Image de production
# ──────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Dépendances de production seulement
COPY api/package*.json ./
RUN npm ci --omit=dev

# Code compilé de l'API
COPY --from=api-builder /app/api/dist ./dist

# Build du client → servi en statique par Express depuis dist/public
COPY --from=client-builder /app/client/dist ./dist/public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.js"]
