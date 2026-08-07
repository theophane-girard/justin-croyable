# syntax=docker/dockerfile:1

# ---- build : workspace complet, bundle Nx/webpack ----
FROM node:22-slim AS build
WORKDIR /workspace
COPY . .
RUN npm ci
RUN npx nx build potager-api

# ---- runtime : image légère, dépendances de prod uniquement ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY packages/potager-api/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /workspace/packages/potager-api/dist ./
# Cloud Run injecte PORT (8080 par défaut) ; main.ts le lit via ConfigService.
EXPOSE 8080
CMD ["node", "main.js"]
