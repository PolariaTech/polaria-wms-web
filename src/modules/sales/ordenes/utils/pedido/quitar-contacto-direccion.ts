const CONTACTO_ETIQUETA_RE =
  /^(?:fax|tel(?:[eé]fono)?s?\b\.?|phone|celular|cel\b\.?|whatsapp|correos?\b|e-?mail|mail\b)/i;
const CONTACTO_CORREO_RE = /\S+@\S+\.\S+/;
const CONTACTO_TELEFONO_RE = /^\+?[\d\s().-]+$/;

function esSegmentoDeContacto(segmento: string): boolean {
  if (CONTACTO_ETIQUETA_RE.test(segmento) || CONTACTO_CORREO_RE.test(segmento)) {
    return true;
  }
  return (
    CONTACTO_TELEFONO_RE.test(segmento) &&
    segmento.replace(/\D/g, "").length >= 7
  );
}

/**
 * Quita de una dirección de entrega los segmentos (separados por coma, punto y
 * coma o salto de línea) que son correo, fax o teléfono. Devuelve null si no
 * queda una dirección.
 */
export function quitarContactoDeDireccion(
  valor: string | null | undefined,
): string | null {
  const segmentos = (valor ?? "")
    .split(/[,;\n]/)
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter((s) => s && !esSegmentoDeContacto(s));
  const limpio = segmentos.join(", ");
  return limpio.length >= 5 ? limpio : null;
}
