# src/services/

Capa de servicios **compartidos** de comunicación HTTP con backends.

## Propósito

- Cliente HTTP base hacia Nest (`api.ts` → `/api` en browser, host Nest en SSR).
- No es el único camino de datos: la mayoría de lecturas tenant van por Supabase (`src/lib/supabase` + `runDomainQuery` en módulos).

## Frontera oficial

Ver [docs/ARQUITECTURA-COMUNICACION.md](../../docs/ARQUITECTURA-COMUNICACION.md):

| Canal | Dónde |
|-------|--------|
| **A** Supabase + RLS | `src/lib/supabase/*`, servicios de módulo con `runDomainQuery` |
| **B** Nest API | este directorio + `*-api.service.ts` en módulos |
| **C** mateo-ia-api | solo BFF Next / Nest (nunca browser) |
| **D** BFF Next | `src/app/api/*` y rutas server afines |

## Convención

- Los módulos de dominio ponen sus servicios en `src/modules/<dominio>/services/`.
- Aquí solo van clientes genéricos (auth headers, base URL, errores).
- Trabajo nuevo: seguir la regla de frontera del doc (no mezclar canales “porque sí”).
