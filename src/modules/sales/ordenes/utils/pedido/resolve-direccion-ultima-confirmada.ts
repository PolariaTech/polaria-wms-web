/**
 * REQ-252: dirección de entrega al elegir razón social.
 * Gana la última OV confirmada de ese comprador; si no hay, la de la ficha.
 */
export function resolveDireccionDesdeUltimaConfirmada(params: {
  ultimaConfirmada?: string | null;
  fichaDireccion?: string | null;
}): string {
  const ultima = (params.ultimaConfirmada ?? "").trim();
  if (ultima) return ultima;
  return (params.fichaDireccion ?? "").trim();
}
