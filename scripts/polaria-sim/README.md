# Polaria Sim Runner (E2E concurrente)

Runner automatizado para ejecutar las 3 simulaciones del PDF en paralelo:

- Andino
- Mar Azul
- Aves

Incluye:

- setup TI (empresa/cuenta/bodega/usuarios),
- maestros (proveedor/cliente/comprador/camion),
- carga de catalogos Excel,
- flujo operativo E2E por roles,
- ciclo B con falla controlada,
- monitoreo en vivo por consola.

## Requisitos

1. Backend local arriba (API).
2. Frontend local arriba (web).
3. Credenciales de usuario configurador TI existentes.
4. Archivos Excel disponibles:
   - `Andino(1).xlsx`
   - `Mar_Azul(1).xlsx`
   - `Aves_Dorada(1).xlsx`

## Variables de entorno obligatorias

```bash
export POLARIA_CONFIG_EMAIL="tu-configurador@dominio.com"
export POLARIA_CONFIG_PASSWORD="tu_password"
```

Opcional si prelogin pide empresa:

```bash
export POLARIA_CONFIG_EMPRESA_CODE="ABCDE"
```

## Instalacion

```bash
npm install
npx playwright install chromium
```

## Ejecucion

Desde `polaria-wms-web`:

```bash
node scripts/polaria-sim/run-polaria-sim.cjs \
  --base-url http://127.0.0.1:3001 \
  --catalog-dir "/ruta/a/tus/excel"
```

Para ver navegador:

```bash
node scripts/polaria-sim/run-polaria-sim.cjs --headed --catalog-dir "/ruta/a/tus/excel"
```

## Opciones utiles

- `--skip-setup`: omite setup TI y maestros/catalogo (si ya existen).
- `--include-processing`: activa intento de fase de procesamiento (experimental).
- `--timeout-ms 45000`: aumenta timeout por accion.

## Notas operativas

- El runner es idempotente en gran parte: si una entidad ya existe, intenta continuar.
- El ciclo B se ejecuta segun cada simulacion:
  - Andino / Mar Azul: diferencia en recepcion.
  - Aves: no conformidad en entrega.
- Evidencia de entrega usa imagen minima generada automaticamente en:
  - `artifacts/polaria-sim/evidencia-simulacion.png`
