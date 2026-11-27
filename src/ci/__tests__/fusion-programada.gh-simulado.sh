#!/usr/bin/env bash
# gh simulado para las pruebas de fusion-programada.yml. Lee su comportamiento de los archivos del
# escenario (carpeta ${ESCENARIO}) y deja cada llamada en llamadas.log.
set -u
echo "$*" >> "${ESCENARIO}/llamadas.log"
sub="$1 $2"

contar() { # cuántas veces se había pedido antes
  previas="$(cat "${ESCENARIO}/$1.contador" 2>/dev/null || echo 0)"
  echo $((previas + 1)) > "${ESCENARIO}/$1.contador"
  echo "${previas}"
}
cambiar() { # cambiar <número> <argumentos de jq>: reescribe el archivo de un PR
  jq -c "${@:2}" "${ESCENARIO}/pr-$1.json" > "${ESCENARIO}/pr-$1.tmp" && mv "${ESCENARIO}/pr-$1.tmp" "${ESCENARIO}/pr-$1.json"
}

if [ "${sub}" = "pr list" ]; then
  base=""; previo=""
  for argumento in "$@"; do
    if [ "${previo}" = "--base" ]; then base="${argumento}"; fi
    previo="${argumento}"
  done
  if [ "${base}" = "main" ]; then
    if [ "$(contar lista)" -lt "$(cat "${ESCENARIO}/listas-sin-calcular")" ]; then
      jq -c 'map(.mergeable = "UNKNOWN")' "${ESCENARIO}/lista-de-prs.json"
    else
      cat "${ESCENARIO}/lista-de-prs.json"
    fi
    exit 0
  fi
  clave="${base//\//_}"
  if [ -f "${ESCENARIO}/hijos-${clave}.fallo" ]; then exit 1; fi
  if [ -f "${ESCENARIO}/hijos-${clave}" ]; then cat "${ESCENARIO}/hijos-${clave}"; fi
  exit 0
fi

if [ "$1" = "api" ]; then
  case "$*" in
    *compare/main...*) cat "${ESCENARIO}/atras-${2##*...}" 2>/dev/null || echo 0 ;;
    *git/ref/heads/main*) if [ -f "${ESCENARIO}/sha-main.fallo" ]; then exit 1; fi; echo "${SHA_MAIN}" ;;
    *deploy.yml/dispatches*) if [ -f "${ESCENARIO}/lanzar-deploy.fallo" ]; then exit 1; fi; echo "${URL_DEPLOY}" ;;
    *) exit 99 ;;
  esac
  exit 0
fi

numero="$3"
case "${sub}" in
  "pr view")
    if [ -f "${ESCENARIO}/ver-${numero}.fallo" ]; then exit 1; fi
    case "$*" in
      *"--json headRefOid") jq -c '{headRefOid}' "${ESCENARIO}/pr-${numero}.json" ;;
      *"--json statusCheckRollup")
        consulta="$(contar "comprobaciones-${numero}")"
        jq -c --argjson consulta "${consulta}" '{statusCheckRollup: .[([$consulta, (length - 1)] | min)]}' "${ESCENARIO}/comprobaciones-${numero}.json" ;;
      *) cat "${ESCENARIO}/pr-${numero}.json" ;;
    esac ;;
  "pr update-branch")
    echo "${GH_TOKEN}" >> "${ESCENARIO}/tokens-actualizar.log"
    if [ -f "${ESCENARIO}/actualizar-${numero}.fallo" ]; then exit 1; fi
    if [ ! -f "${ESCENARIO}/oid-${numero}.nocambia" ]; then
      cambiar "${numero}" --slurpfile ci "${ESCENARIO}/comprobaciones-${numero}.json" \
        '.headRefOid = "bbb\(.number)" | .mergeStateStatus = "CLEAN" | .statusCheckRollup = $ci[0][-1]'
    fi ;;
  "pr merge") if [ -f "${ESCENARIO}/fusionar-${numero}.fallo" ]; then exit 1; fi ;;
  "pr edit")
    if [ -f "${ESCENARIO}/reapuntar-${numero}.fallo" ]; then exit 1; fi
    cambiar "${numero}" '.baseRefName = "main"' ;;
  "pr comment") ;;
  *) exit 99 ;;
esac
