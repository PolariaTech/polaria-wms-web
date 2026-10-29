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

/** Tiempo que una marca local manda sobre el servidor; pasado eso, el servidor decide. */
export const VIGENCIA_MARCA_LOCAL_MS = 20_000;

export const MENSAJE_VERSION_NUEVA =
  "Hay una versión nueva de Polaria. Recarga la página (Ctrl+F5) y vuelve a imprimir.";

const PATRON_VERSION_VIEJA =
  /failed to load chunk|loading chunk [\w-]+ failed|loading css chunk|error loading dynamically imported module|failed to fetch dynamically imported module|importing a module script failed/i;

/**
 * Una pestaña abierta antes de un despliegue pide archivos que la versión nueva ya no
 * tiene (ChunkLoadError). No es un fallo de la impresora: basta con recargar la página.
 */
export function esErrorDeVersionVieja(error: unknown): boolean {
  if (typeof error === "string") return PATRON_VERSION_VIEJA.test(error);
  if (!(error instanceof Error)) return false;
  return (
    error.name === "ChunkLoadError" || PATRON_VERSION_VIEJA.test(error.message)
  );
}

/** Hora (ms) en que se puso cada marca local, por OV. */
export type MarcasLocalesPorOv = ReadonlyMap<string, number>;

/**
 * El servidor manda. Las marcas locales cubren solo el instante entre el clic y el
 * reload: pasado `VIGENCIA_MARCA_LOCAL_MS` se ignoran, para que una marca vieja no
 * contradiga lo que otro usuario ya registró (REQ-189).
 */
export function mergeCorreoNoEnviado(input: {
  servidor: ReadonlySet<string>;
  marcados: MarcasLocalesPorOv;
  quitados: MarcasLocalesPorOv;
  ahora: number;
}): Set<string> {
  const vigente = (puestaEn: number) =>
    input.ahora - puestaEn < VIGENCIA_MARCA_LOCAL_MS;
  const next = new Set(input.servidor);
  for (const [id, puestaEn] of input.marcados) {
    if (vigente(puestaEn)) next.add(id);
  }
  for (const [id, puestaEn] of input.quitados) {
    if (vigente(puestaEn)) next.delete(id);
  }
  return next;
}
