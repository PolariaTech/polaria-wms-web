/**
 * Densidad de tabla para pantallas bajas (menos de 50 rem de alto, típico de un portátil de
 * 14″): filas de 2,5 rem en vez de 3,25, encabezado, títulos de columna y paginación más
 * ajustados (y, en correos, la franja de filtros). Así caben las 5 filas de una página con su paginación sin desplazar la página ni
 * la tabla. En pantallas altas no cambia nada.
 *
 * Se aplica en el `className` de la tarjeta de la tabla (`PolariaDataTable` o la lista de
 * correos) y actúa sobre sus partes por selector, sin tocar los componentes compartidos.
 * `!` en el alto mínimo: la tabla lo reserva con un `style` en línea (5 filas × 3,25 rem).
 *
 * Las clases van escritas completas: Tailwind no genera las que se arman con texto.
 */
export const TABLA_COMPACTA_PANTALLA_BAJA = [
  "[@media(max-height:50rem)]:[&_tbody_tr]:h-10",
  "[@media(max-height:50rem)]:[&_th]:py-2",
  "[@media(max-height:50rem)]:[&>header]:py-2",
  "[@media(max-height:50rem)]:[&>footer]:py-2",
  "[@media(max-height:50rem)]:[&_.polaria-scrollbar]:min-h-[12.5rem]!",
  "[@media(max-height:50rem)]:[&_.overflow-x-hidden]:min-h-[12.5rem]!",
  // Filtros de correos: franja más baja y sin los rótulos «Desde/Hasta» (siguen para lectores de pantalla).
  "[@media(max-height:50rem)]:[&_[role=search]]:py-1.5",
  "[@media(max-height:50rem)]:[&_[role=search]_label]:sr-only",
].join(" ");
