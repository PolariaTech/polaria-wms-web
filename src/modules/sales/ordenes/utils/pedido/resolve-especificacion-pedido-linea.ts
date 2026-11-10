import {
  extractDomoEspecificacion,
  extractMadurezEspecificacion,
  stripEtiquetaMadurez,
  textoYaTraeMadurez,
} from "./especificacion-madurez-domo";
import {
  formatEspecificacionEnvase,
  type CantidadEnvaseResuelta,
} from "./resolve-cantidad-envase";

function quitarAcentos(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
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
}): string {
  const envaseTxt = params.envase
    ? formatEspecificacionEnvase(params.envase)
    : (params.envaseTexto?.trim() || "");
  const ia = params.especificacionIa?.trim() || "";
  const madurez =
    extractMadurezEspecificacion(params.textoOriginal) ||
    extractMadurezEspecificacion(ia) ||
    "";
  const domo =
    extractDomoEspecificacion(params.textoOriginal) ||
    extractDomoEspecificacion(ia) ||
    "";

  const parts: string[] = [];
  if (envaseTxt) parts.push(envaseTxt);

  if (madurez && !textoYaTraeMadurez(ia, madurez)) {
    const already = parts.some((p) => textoYaTraeMadurez(p, madurez));
    if (!already) parts.push(madurez);
  }

  if (domo) {
    const already = parts.some((p) =>
      quitarAcentos(p).toLowerCase().includes(quitarAcentos(domo).toLowerCase()),
    );
    const iaYaTrae = quitarAcentos(ia)
      .toLowerCase()
      .includes(quitarAcentos(domo).toLowerCase());
    if (!already && !iaYaTrae) parts.push(domo);
  }

  if (ia) {
    const iaEsSoloMadurez =
      Boolean(madurez) &&
      (quitarAcentos(ia) === quitarAcentos(madurez) ||
        quitarAcentos(ia) === quitarAcentos(stripEtiquetaMadurez(madurez)));
    const iaEsSoloDomo =
      Boolean(domo) && quitarAcentos(ia) === quitarAcentos(domo);
    const iaEsEnvase = Boolean(envaseTxt) && pareceFraseEnvase(ia);
    if (!iaEsSoloMadurez && !iaEsSoloDomo && !iaEsEnvase) {
      const already = parts.some((p) =>
        quitarAcentos(p).includes(quitarAcentos(ia)),
      );
      if (!already) parts.push(ia);
    }
  }

  if (parts.length > 0) return parts.join(" · ");
  return ia;
}
