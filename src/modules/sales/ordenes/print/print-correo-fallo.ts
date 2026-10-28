/** El correo a la impresora no salió, y el reintento tampoco. */
export const TIPO_CORREO_NO_ENVIADO = "impresion_correo_no_enviada";

export const TIPOS_IMPRESION_OK = [
  "impresion_pdf",
  "impresion_pdf_auto",
] as const;

export const MENSAJE_CORREO_NO_ENVIADO =
  "El correo no fue enviado a la impresora";

export const MENSAJE_CORREO_MAS_TARDE =
  "No se envió el correo a la impresión, inténtelo más tarde.";

export type ImpresionMarca = {
  idOrdenVenta: string;
  tipo: string;
  createdAt: string;
};

/** La marca vigente es la más reciente. Un envío posterior apaga el aviso. */
export function idsConCorreoNoEnviado(
  marcas: readonly ImpresionMarca[],
): Set<string> {
  const latest = new Map<string, ImpresionMarca>();
  for (const marca of marcas) {
    const id = marca.idOrdenVenta.trim();
    const tipo = marca.tipo.trim();
    if (!id || !tipo) continue;
    const prev = latest.get(id);
    if (!prev || marca.createdAt > prev.createdAt) {
      latest.set(id, { ...marca, idOrdenVenta: id, tipo });
    }
  }

  const ids = new Set<string>();
  for (const [id, marca] of latest) {
    if (marca.tipo === TIPO_CORREO_NO_ENVIADO) ids.add(id);
  }
  return ids;
}

/** El servidor manda. Las marcas locales cubren el instante entre el clic y el reload. */
export function mergeCorreoNoEnviado(input: {
  servidor: ReadonlySet<string>;
  marcados: ReadonlySet<string>;
  quitados: ReadonlySet<string>;
}): Set<string> {
  const next = new Set(input.servidor);
  for (const id of input.marcados) next.add(id);
  for (const id of input.quitados) next.delete(id);
  return next;
}
