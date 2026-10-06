# Paleta de colores — polaria.tech

Fuente de verdad visual del proyecto. Definida en `src/app/globals.css` como CSS variables.

## Colores principales

| Variable | Valor | Uso en Tailwind |
|----------|-------|-----------------|
| `--bg` | `#020609` | `bg-polaria-bg` |
| `--teal` | `#00e5cc` | `text-polaria-teal`, `bg-polaria-teal` |
| `--w` | `#f8f8f6` | `text-polaria-w` |
| `--on-teal` | `#020609` | `text-polaria-on-teal` (texto sobre botones teal; fijo en dark/light) |

## Variantes con opacidad

| Variable | Tailwind | Uso |
|----------|----------|-----|
| `--t20` | `border-polaria-t-20` | Bordes, líneas decorativas |
| `--t08` | `bg-polaria-t-08` | Fondos sutiles de tarjetas |
| `--w50` | `text-polaria-w-50` | Texto secundario |
| `--w20` | `text-polaria-w-20` | Texto terciario / footer |
| `--w08` | `bg-polaria-w-08` | Inputs, separadores |

## Efectos

| Clase / variable | Uso |
|------------------|-----|
| `.polaria-aurora` | Fondo aurora animado |
| `.polaria-teal-glow` | Glow del logo / iconos |
| `.polaria-card-glow` | Glow de tarjetas |
| `.polaria-gradient-stat` | Texto con gradiente teal→cian |

| `.polaria-text-display` | Títulos principales (h1) |
| `.polaria-text-brand` | Marca en topbar |
| `.polaria-text-card-title` | Títulos de tarjetas |
| `.polaria-text-subtitle` | Subtítulos y descripciones |
| `.polaria-text-body` | Texto general |
| `.polaria-text-body-sm` | Botones, fecha |
| `.polaria-text-label` | Labels uppercase (FECHA) |
| `.polaria-text-caption` | Texto auxiliar pequeño |
| `.polaria-text-badge` | Badges cyan |

## Topbar

| Clase | Uso |
|-------|-----|
| `.polaria-topbar-btn` | Base botón (altura 40px) |
| `.polaria-topbar-btn--neutral` | Menú |
| `.polaria-topbar-btn--teal` | Mateo IA |
| `.polaria-topbar-btn--danger` | Cerrar sesión |
| `.polaria-topbar-btn--icon` | Variante solo icono (móvil) |
| `.polaria-topbar-divider` | Línea cyan bajo topbar |
| `.polaria-topbar-user` | Chip de usuario |

## Reglas de diseño

1. **No inventar colores** — usar solo tokens de esta paleta.
2. **Base oscura** `--bg` para fondos; **teal** para acentos; **blanco cálido** `--w` para texto principal.
3. Texto secundario → `--w50`; terciario → `--w20`.
4. Bordes y highlights → `--t20` o `--t08`.
5. Botones primarios: `bg-polaria-teal text-polaria-on-teal` (nunca `text-polaria-bg` sobre teal: en modo claro `--bg` se aclara y el contraste falla).
