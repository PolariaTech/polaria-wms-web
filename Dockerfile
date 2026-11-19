# syntax=docker/dockerfile:1

# Imagen del frontend WMS (Next.js 16) para ECS Fargate ARM64 (POL-349, decisión D1: opción A).
# Probado el 2026-11-19 con el código del tag v2.13.23: build local (amd64) y prueba de humo
# (scripts/docker-smoke.sh) OK, ~572 MB comprimida. El build arm64 lo valida el workflow de despliegue.
#
# Build local:
#   docker buildx build --platform linux/arm64 --load \
#     --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.polaria.tech \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
#     -t polaria-wms-web:local .
#
# IMPORTANTE: las variables NEXT_PUBLIC_* se FIJAN al construir (Next.js las escribe en el
# JavaScript del navegador y en las reglas de reenvío /api/* -> API). Por eso hay UNA imagen por
# ambiente. Los SECRETOS de servidor (OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SMTP_*,
# CLOUDINARY_*, ...) NO van aquí: se inyectan en tiempo de ejecución desde Secrets Manager.
# Nunca declares un secreto como ARG: quedaría guardado en las capas de la imagen.

# Node 24 = la versión que usa hoy el proyecto en Vercel (nodeVersion 24.x).
ARG NODE_IMAGE=node:24-bookworm-slim

# ── Etapa 1: build ───────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS build
WORKDIR /app

# Primero solo los manifiestos: si no cambian, Docker reutiliza la capa de npm ci.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Variables públicas (se escriben en el bundle del navegador). La clave anon de Supabase es
# pública por diseño (la protege RLS); aun así se pasa en el build, nunca se copia de un .env.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_MATEO_URL
ARG NEXT_PUBLIC_MATEO_WIDGET_SCRIPT_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_MATEO_URL=${NEXT_PUBLIC_MATEO_URL} \
    NEXT_PUBLIC_MATEO_WIDGET_SCRIPT_URL=${NEXT_PUBLIC_MATEO_WIDGET_SCRIPT_URL} \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Etapa 2: runtime ─────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# No se hace `npm prune --omit=dev`: next.config.ts lo carga Next al arrancar y no se ha
# comprobado que funcione sin TypeScript instalado. Se puede adelgazar la imagen después, con
# la prueba de arranque (scripts/docker-smoke.sh) como red de seguridad.
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/next.config.ts ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3001

# La imagen slim no trae curl; Node trae fetch. La ruta del health check está por confirmar
# (la raíz puede redirigir a /login; fetch sigue la redirección).
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Sin npm de por medio, para que SIGTERM llegue directo a Node.
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001", "-H", "0.0.0.0"]
