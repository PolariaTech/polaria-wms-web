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

function quitarAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "");
}

function pareceFraseEnvase(texto: string): boolean {
  return /\b(?:galon|cubeta|litro|caja|bidon|envase|\dx)\b/i.test(
    quitarAcentos(texto),
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
  /** REQ-287: `Especificacion` del renglón de origen_correo (lo que Mateo leyó del documento). */
  especificacionOrigen?: string | null | undefined;
}): string {
  const envaseTxt = params.envase
    ? formatEspecificacionEnvase(params.envase)
    : (params.envaseTexto?.trim() || "");
  const textoIa = params.especificacionIa?.trim() || "";
  const frasesOrigen = frasesDeEspecificacion(params.especificacionOrigen);
  const madurez =
    extractMadurezEspecificacion(params.textoOriginal) ||
    extractMadurezEspecificacion(textoIa) ||
    frasesOrigen.map(extractMadurezEspecificacion).find(Boolean) ||
    "";
  const domo =
    extractDomoEspecificacion(params.textoOriginal) ||
    extractDomoEspecificacion(textoIa) ||
    extractDomoEspecificacion(params.especificacionOrigen) ||
    "";

  const parts: string[] = [];
  if (envaseTxt) parts.push(envaseTxt);

  if (madurez && !textoYaTraeMadurez(textoIa, madurez)) {
    const already = parts.some((p) => textoYaTraeMadurez(p, madurez));
    if (!already) parts.push(madurez);
  }

  if (domo) {
    const already = parts.some((p) =>
      quitarAcentos(p).toLowerCase().includes(quitarAcentos(domo).toLowerCase()),
    );
    const iaYaTrae = quitarAcentos(textoIa)
      .toLowerCase()
      .includes(quitarAcentos(domo).toLowerCase());
    if (!already && !iaYaTrae) parts.push(domo);
  }

  if (textoIa) {
    const iaEsSoloMadurez =
      Boolean(madurez) &&
      (quitarAcentos(textoIa) === quitarAcentos(madurez) ||
        quitarAcentos(textoIa) === quitarAcentos(stripEtiquetaMadurez(madurez)));
    const iaEsSoloDomo =
      Boolean(domo) && quitarAcentos(textoIa) === quitarAcentos(domo);
    const iaEsEnvase = Boolean(envaseTxt) && pareceFraseEnvase(textoIa);
    if (!iaEsSoloMadurez && !iaEsSoloDomo && !iaEsEnvase) {
      const already = parts.some((p) =>
        quitarAcentos(p).includes(quitarAcentos(textoIa)),
      );
      if (!already) parts.push(textoIa);
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

  return textoEspecificacionTrasFiltroSolicitado(
    parts,
    params.textoOriginal ?? "",
    textoIa,
  );
}
