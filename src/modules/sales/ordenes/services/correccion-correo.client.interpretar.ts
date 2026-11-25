import {
  CorreccionCorreoApiError,
  type InterpretacionInstruccionApi,
} from "./correccion-correo.client.types";
import {
  cabecerasCorreccionCorreo,
  esNumeroPositivo,
  pedirJsonCorreccionCorreo,
  urlOtCorreccionCorreo,
} from "./correccion-correo.client.http";

/**
 * Decide qué función ejecutar con lo que escribió el usuario. Tarda unos segundos.
 */
export async function interpretarInstruccion(params: {
  idOrdenVenta: string;
  requestId: string;
  instruccion: string;
  signal?: AbortSignal;
}): Promise<InterpretacionInstruccionApi> {
  const { cuerpo, status } = await pedirJsonCorreccionCorreo(
    urlOtCorreccionCorreo(params.idOrdenVenta, "interpretar-instruccion"),
    {
      method: "POST",
      headers: cabecerasCorreccionCorreo(),
      signal: params.signal,
      body: JSON.stringify({
        requestId: params.requestId,
        instruccion: params.instruccion.trim(),
      }),
    },
  );

  const intencion = cuerpo.intencion;
  if (
    cuerpo.requestId !== params.requestId ||
    (intencion !== "reorganizar" && intencion !== "releer_documentos")
  ) {
    throw new CorreccionCorreoApiError(
      "La respuesta del servidor no corresponde a la solicitud. Inténtalo de nuevo.",
      "RESPUESTA_INESPERADA",
      status,
    );
  }

  const bruto =
    typeof cuerpo.expectativas === "object" && cuerpo.expectativas !== null
      ? (cuerpo.expectativas as Record<string, unknown>)
      : {};
  return {
    intencion,
    motivo: typeof cuerpo.motivo === "string" ? cuerpo.motivo : "",
    expectativas: {
      ...(esNumeroPositivo(bruto.totalOt) ? { totalOt: bruto.totalOt } : {}),
      ...(esNumeroPositivo(bruto.importeTotal)
        ? { importeTotal: bruto.importeTotal }
        : {}),
    },
    porReglas: cuerpo.porReglas === true,
  };
}