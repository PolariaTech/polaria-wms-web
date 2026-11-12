import {
  extractDomoEspecificacion,
  extractMadurezEspecificacion,
  stripEtiquetaMadurez,
  textoYaTraeMadurez,
} from "./especificacion-madurez-domo";
import {
  esAtributoPedido,
  fraseRedundanteConSolicitado,
  frasesDeEspecificacion,
  fraseSinEnvase,
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
  const ia = params.especificacionIa?.trim() || "";
  const frasesOrigen = frasesDeEspecificacion(params.especificacionOrigen);
  const madurez =
    extractMadurezEspecificacion(params.textoOriginal) ||
    extractMadurezEspecificacion(ia) ||
    frasesOrigen.map(extractMadurezEspecificacion).find(Boolean) ||
    "";
  const domo =
    extractDomoEspecificacion(params.textoOriginal) ||
    extractDomoEspecificacion(ia) ||
    extractDomoEspecificacion(params.especificacionOrigen) ||
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

  for (const frase of frasesOrigen) {
    const util = fraseSinEnvase(frase, Boolean(envaseTxt));
    const repetida =
      !util ||
      (madurez && extractMadurezEspecificacion(util) === madurez) ||
      (domo && extractDomoEspecificacion(util)) ||
      parts.some((p) => quitarAcentos(p).toLowerCase().includes(quitarAcentos(util).toLowerCase()));
    if (!repetida) parts.push(util);
  }

  // La madurez que venía sola en `ia` no se repite arriba; si hay otras partes, no puede perderse.
  if (madurez && parts.length > 0 && !parts.some((p) => textoYaTraeMadurez(p, madurez))) {
    parts.splice(envaseTxt ? 1 : 0, 0, madurez);
  }

  // No repetir en Especificación lo que ya dice Solicitado, salvo atributos pedidos.
  const solicitado = params.textoOriginal ?? "";
  const visibles = parts.filter(
    (parte) =>
      esAtributoPedido(parte) || !fraseRedundanteConSolicitado(parte, solicitado),
  );

  if (visibles.length > 0) return visibles.join(" · ");
  return ia;
}
