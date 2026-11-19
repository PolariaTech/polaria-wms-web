#!/usr/bin/env bash
# Prueba de humo de la imagen Docker del frontend: arranca el contenedor con variables falsas de
# runtime, espera a que GET / (siguiendo la redirección a /login) responda 200, comprueba que no
# corra como root y reporta arquitectura y tamaño. Mismo patrón que la de la API.
# La usa el workflow de despliegue (.github/workflows/deploy.yml) y el build local.
#
# Uso: scripts/docker-smoke.sh [imagen]   (por defecto polaria-wms-web:local)
set -euo pipefail

IMAGE="${1:-polaria-wms-web:local}"
NAME="wms-web-smoke"
HOST_PORT="${SMOKE_PORT:-3001}"
ENV_FILE="$(dirname "$0")/docker-smoke.env"
# Provisional: sin medición todavía (la imagen conserva las dependencias de desarrollo).
# Ajustar después de la primera corrida real, con el tamaño que muestre el resumen.
MAX_SIZE_MB=800

docker rm -f "$NAME" >/dev/null 2>&1 || true
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

docker run -d --name "$NAME" --env-file "$ENV_FILE" -p "$HOST_PORT:3001" "$IMAGE" >/dev/null

code() { curl -s -L -m 10 -o /dev/null -w '%{http_code}' "http://localhost:$HOST_PORT/" || true; }

echo "Esperando GET / en localhost:$HOST_PORT ..."
for _ in $(seq 1 45); do
  if [ "$(code)" = "200" ]; then
    echo "OK: GET / respondió 200"
    break
  fi
  if [ "$(docker inspect -f '{{.State.Running}}' "$NAME")" != "true" ]; then
    echo "ERROR: el contenedor se detuvo"
    docker logs "$NAME"
    exit 1
  fi
  sleep 2
done

if [ "$(code)" != "200" ]; then
  echo "ERROR: GET / no respondió 200 en 90 s"
  docker logs "$NAME"
  exit 1
fi

USER_IN_CONTAINER="$(docker exec "$NAME" whoami)"
if [ "$USER_IN_CONTAINER" = "root" ]; then
  echo "ERROR: el contenedor corre como root"
  exit 1
fi
echo "OK: corre como '$USER_IN_CONTAINER'"

ARCH="$(docker image inspect -f '{{.Architecture}}' "$IMAGE")"
SIZE_MB=$(( $(docker image inspect -f '{{.Size}}' "$IMAGE") / 1024 / 1024 ))
# Aproximación de lo que se guarda en el registro y se descarga al arrancar (capas en gzip).
GZIP_MB=$(( $(docker save "$IMAGE" | gzip -1 | wc -c) / 1024 / 1024 ))
echo "Imagen: $IMAGE · arquitectura: $ARCH · ~${GZIP_MB} MB comprimida (objetivo < ${MAX_SIZE_MB} MB) · ${SIZE_MB} MB sin comprimir"

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### Imagen Docker del frontend"
    echo "| Arquitectura | Comprimida (aprox.) | Objetivo (comprimida) | Sin comprimir | GET / | Usuario |"
    echo "|---|---|---|---|---|---|"
    echo "| $ARCH | ~${GZIP_MB} MB | < ${MAX_SIZE_MB} MB | ${SIZE_MB} MB | 200 | $USER_IN_CONTAINER |"
  } >> "$GITHUB_STEP_SUMMARY"
fi

if [ "$GZIP_MB" -ge "$MAX_SIZE_MB" ]; then
  echo "ERROR: la imagen comprimida supera ${MAX_SIZE_MB} MB"
  exit 1
fi
