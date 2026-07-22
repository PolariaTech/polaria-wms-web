# Widget Mateo embebido — Polaria WMS Web

Chat flotante **Mateo Support** dentro del shell autenticado (`AppShellLayout`).  
No reemplaza el SSO full-page del botón **Mateo IA** del topbar.

## Piezas

| Pieza | Rol |
|-------|-----|
| `MateoWidgetHost` | Carga el IIFE, `configureTokenFetcher` + `mount` |
| `NEXT_PUBLIC_MATEO_WIDGET_SCRIPT_URL` | URL del bundle (`/assets/mateo-widget.js` en local) |
| `POST /auth/mateo/widget-token` | JWT para n8n (vía proxy `/api`) |
| `GET/POST /api/mateo/conversaciones` | Historial remoto (rewrite → Nest) |

Repos fuente: [Widget-react `docs/EMBED-POLARIA.md`](https://github.com/PolariaTech/Widget-react/blob/main/docs/EMBED-POLARIA.md) · API: [MATEO-INTEGRATION.md](https://github.com/PolariaTech/polaria-wms-api/blob/main/docs/MATEO-INTEGRATION.md).

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_MATEO_WIDGET_SCRIPT_URL` | Script IIFE. Dev: `/assets/mateo-widget.js`. Prod: CDN del repo Widget-react. |
| `NEXT_PUBLIC_MATEO_N8N_WEBHOOK_URL` | Opcional; el bundle suele llevar el webhook de build. |
| `NEXT_PUBLIC_MATEO_URL` | Solo SSO full-page (topbar), **no** el widget. |

### Dev local — copiar el bundle

```bash
cd ../Widget-react
npm run build:lib
copy dist\assets\mateo-widget.js ..\polaria-wms-web\public\assets\mateo-widget.js
```

Tras cambiar `.env` (`NEXT_PUBLIC_*`), **reinicia** `next dev`.

## Comportamiento del host

1. Solo monta con sesión hidratada (`accessToken`).
2. `configureTokenFetcher` → `POST /auth/mateo/widget-token` (Bearer WMS).
3. `mount(container, { conversationApiBase: '/api/mateo/conversaciones', conversationTokenFetcher })`  
   - JWT widget → n8n  
   - Bearer WMS → REST conversaciones
4. `onAuthError` cierra el chat y muestra toast; **no** hace logout del shell.
5. El launcher es del widget (`fixed` bottom-right). El contenedor del host no debe ser un `fixed` 0×0.

## Dos experiencias Mateo

| UI | Qué hace |
|----|----------|
| Botón topbar **Mateo IA** | SSO → app Mateo full-page (`mateo-handoff`) |
| Burbuja flotante | Widget embebido (este doc) |

## Checklist local

1. API Nest con `MATEO_WIDGET_JWT_SECRET` alineado a n8n (`iss`/`aud`/`kid`).
2. Migración `051` aplicada (`widget_conversacion` / `widget_mensaje`).
3. Bundle en `public/assets/mateo-widget.js` y `NEXT_PUBLIC_MATEO_WIDGET_SCRIPT_URL=/assets/mateo-widget.js`.
4. Login WMS → burbuja abajo-derecha → mensaje → respuesta visible en el mismo hilo.

## Troubleshooting

| Síntoma | Causa típica |
|---------|----------------|
| No aparece la burbuja | Script 404 (URL Vercel sin asset) o `.env` sin reiniciar |
| Historial 500 | Migración `051` no aplicada |
| Mensajes 400 | Id local `conv_*` (bundle viejo); actualizar IIFE |
| Respuesta n8n no se ve | Alias id local→UUID (arreglado en Widget-react reciente) |
| n8n “sin permiso” | Secreto/`iss`/`aud`/`kid` distintos entre API y n8n |

## Código

```
src/components/mateo/MateoWidgetHost.tsx
src/components/mateo/load-mateo-widget.ts
src/components/mateo/mateo-widget.types.ts
src/components/layouts/shell/AppShellLayout.tsx  # monta MateoWidgetHost
```

## Cierre POL-137

| Escenario | Comportamiento esperado |
|-----------|-------------------------|
| Sin login | `MateoWidgetHost` retorna `null`; no carga script |
| Sesión expirada | Desmonta widget; `onAuthError` → toast sin logout del shell |
| Token widget rechazado | `configureTokenFetcher` falla → widget no envía mensajes a n8n |
| Historial ajeno | API `/mateo/conversaciones` responde 404 (ownership por `id_usuario`) |

Tests: `src/components/mateo/MateoWidgetHost.test.tsx`.
