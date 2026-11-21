import {
  extractDomoEspecificacion,
  extractMadurezEspecificacion,
  stripEtiquetaMadurez,
  textoYaTraeMadurez,
} from "./especificacion-madurez-domo";
import {
  agregarFrasesOrigenSinRepetir,
  frasesDeEspecificacion,
  textoEspecificacionTrasFiltroSolicitado,
} from "./especificacion-origen";
import {
  formatEspecificacionEnvase,
  type CantidadEnvaseResuelta,
} from "./resolve-cantidad-envase";
import {
  atributosCalidadDesdeSolicitado,
  calibresDesdeSolicitado,
} from "./atributos-calidad-desde-solicitado";

function quitarAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "");
}

function pareceFraseEnvase(texto: string): boolean {
  return /\b(?:galon|cubeta|litro|caja|bidon|envase|\dx)\b/i.test(
    quitarAcentos(texto),
  );
}

/** REQ-311: "20 KGM" / "6 PZA" no es especificación de producto. */
function esSoloCantidadYUnidad(texto: string): boolean {
  return /^\d+(?:[.,]\d+)?\s*(?:KGM|KG|LTR|L|PZA|PZ|UN|U\.?M\.?)\.?$/i.test(
    texto.trim(),
  );
}

/**
 * Especificación de línea: envase (REQ-124), madurez/domo (REQ-120/287)
 * y lo que Mateo extrajo del pedido.
 */
export function resolveEspecificacionPedidoLinea(params: {
  especificacionIa: string | null | undefined;
  envase?: CantidadEnvaseResuelta | null | undefined;
  /** Frase de envase ya formateada (alternativa a `envase`). */
  envaseTexto?: string | null | undefined;
  textoOriginal?: string | null | undefined;
  /** Nombre del SKU de catálogo: no repetir su variedad como especificación. */
  nombreCatalogo?: string | null | undefined;
  /** REQ-287: `Especificacion` del renglón de origen_correo (lo que Mateo leyó del documento). */
  especificacionOrigen?: string | null | undefined;
  /** REQ-380: frase «Pedido en PZA» cuando la unidad del documento ≠ catálogo. */
  unidadPedidoDiscrepante?: string | null | undefined;
}): string {
  const envaseTxt = params.envase
    ? formatEspecificacionEnvase(params.envase)
    : (params.envaseTexto?.trim() || "");
  const textoIaRaw = params.especificacionIa?.trim() || "";
  const textoIa = esSoloCantidadYUnidad(textoIaRaw) ? "" : textoIaRaw;
  const frasesOrigen = frasesDeEspecificacion(params.especificacionOrigen).filter(
    (frase) => !esSoloCantidadYUnidad(frase),
  );
  // REQ-363: no dejar la unidad suelta («KG») como especificación.
  const textoIaSinUnidad = (() => {
    const limpio = textoIa
      .replace(/^\s*(?:KGM|KG|LTR|L|PZA|PZ)\s*[,;·-]?\s*/i, "")
      .trim();
    return esSoloCantidadYUnidad(limpio) ? "" : limpio;
  })();
  const madurez =
    extractMadurezEspecificacion(params.textoOriginal) ||
    extractMadurezEspecificacion(textoIaSinUnidad) ||
    frasesOrigen.map(extractMadurezEspecificacion).find(Boolean) ||
    "";
  const domo =
    extractDomoEspecificacion(params.textoOriginal) ||
    extractDomoEspecificacion(textoIaSinUnidad) ||
    extractDomoEspecificacion(params.especificacionOrigen) ||
    "";
  const calidadSolicitado = atributosCalidadDesdeSolicitado(
    params.textoOriginal,
    { nombreCatalogo: params.nombreCatalogo },
  );

  const parts: string[] = [];
  const unidadPedido = params.unidadPedidoDiscrepante?.trim() || "";
  if (unidadPedido) parts.push(unidadPedido);
  if (envaseTxt) parts.push(envaseTxt);

  if (madurez && !textoYaTraeMadurez(textoIaSinUnidad, madurez)) {
    const already = parts.some((p) => textoYaTraeMadurez(p, madurez));
    if (!already) parts.push(madurez);
  }

  if (domo) {
    const already = parts.some((parte) =>
      quitarAcentos(parte).toLowerCase().includes(quitarAcentos(domo).toLowerCase()),
    );
    const iaYaTrae = quitarAcentos(textoIaSinUnidad)
      .toLowerCase()
      .includes(quitarAcentos(domo).toLowerCase());
    if (!already && !iaYaTrae) parts.push(domo);
  }

  for (const atributo of calidadSolicitado) {
    const already = parts.some((parte) =>
      quitarAcentos(parte)
        .toLowerCase()
        .includes(quitarAcentos(atributo).toLowerCase()),
    );
    if (!already) parts.push(atributo);
  }

  if (textoIaSinUnidad) {
    const iaEsSoloMadurez =
      Boolean(madurez) &&
      (quitarAcentos(textoIaSinUnidad) === quitarAcentos(madurez) ||
        quitarAcentos(textoIaSinUnidad) ===
          quitarAcentos(stripEtiquetaMadurez(madurez)));
    const iaEsSoloDomo =
      Boolean(domo) &&
      quitarAcentos(textoIaSinUnidad) === quitarAcentos(domo);
    const iaEsEnvase =
      Boolean(envaseTxt) && pareceFraseEnvase(textoIaSinUnidad);
    if (!iaEsSoloMadurez && !iaEsSoloDomo && !iaEsEnvase) {
      const already = parts.some((parte) =>
        quitarAcentos(parte).includes(quitarAcentos(textoIaSinUnidad)),
      );
      if (!already) parts.push(textoIaSinUnidad);
    }
  }

  agregarFrasesOrigenSinRepetir({
    frasesOrigen,
    partes: parts,
    hayEnvase: Boolean(envaseTxt),
    madurez,
    domo,
  });

  // La madurez que venía sola en `ia` no se repite arriba; si hay otras partes, no puede perderse.
  if (madurez && parts.length > 0 && !parts.some((p) => textoYaTraeMadurez(p, madurez))) {
    parts.splice(envaseTxt ? 1 : 0, 0, madurez);
  }

  const filtrado = textoEspecificacionTrasFiltroSolicitado(
    parts,
    params.textoOriginal ?? "",
    textoIaSinUnidad,
  );
  // REQ-346: calibre/talla debe verse en Especificación aunque también esté en Solicitado
  // (el filtro REQ-287 lo trataría como redundante).
  const calibres = calibresDesdeSolicitado(params.textoOriginal).filter(
    (calibre) =>
      !params.nombreCatalogo ||
      !quitarAcentos(params.nombreCatalogo)
        .toLowerCase()
        .includes(quitarAcentos(calibre).toLowerCase()),
  );
  const faltan = calibres.filter(
    (calibre) =>
      !quitarAcentos(filtrado)
        .toLowerCase()
        .includes(quitarAcentos(calibre).toLowerCase()),
  );
  if (faltan.length === 0) return filtrado;
  return [filtrado, ...faltan].filter(Boolean).join(" · ");
}
