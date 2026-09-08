import OpenAI from "openai";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

/** Visión de alta calidad para manuscrito en hoja impresa. */
export const OPENAI_SURTIDO_VISION_MODEL = "gpt-4o";

const SURTIDO_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["campos", "lineas", "observacionesIa"],
  properties: {
    campos: {
      type: "array",
      description:
        "Cualquier campo de la hoja llenado a mano (etiqueta visible + valor leído).",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["etiqueta", "valor"],
        properties: {
          etiqueta: { type: "string" },
          valor: { type: "string" },
        },
      },
    },
    lineas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "indice",
          "cantidadPreparada",
          "codigoIncidencia",
          "nota",
          "alisto",
          "reviso",
        ],
        properties: {
          indice: {
            type: "integer",
            description: "Número de fila # en la tabla de productos (1-based).",
          },
          cantidadPreparada: { type: ["string", "null"] },
          codigoIncidencia: {
            type: ["string", "null"],
            description: "Código A–F u otro escrito en Cód.",
          },
          nota: { type: ["string", "null"] },
          alisto: { type: ["boolean", "null"] },
          reviso: { type: ["boolean", "null"] },
        },
      },
    },
    observacionesIa: {
      type: ["string", "null"],
      description: "Resumen breve de marcas ambiguas o dudas de lectura.",
    },
  },
} as const;

function buildOriginalSnapshot(original: OrdenTareaAlmacenPrintData): string {
  return JSON.stringify(
    {
      folio: original.folio,
      cliente: original.cliente,
      centroConsumo: original.centroConsumo,
      numeroOrdenCliente: original.numeroOrdenCliente,
      fechaEntrega: original.fechaEntrega,
      direccionEntrega: original.direccionEntrega,
      lineas: original.lineas.map((linea, index) => ({
        indice: index + 1,
        producto: linea.producto,
        especificacion: linea.especificacion,
        cantidadSolicitada: linea.cantidadSolicitada,
        cantidadPreparada: "(vacío en original)",
        codigoIncidencia: "(vacío)",
        nota: "(vacío)",
        alisto: "(checkbox vacío)",
        reviso: "(checkbox vacío)",
      })),
      otrosCamposVaciosEnOriginal: [
        "Factura asociada",
        "Hora comprometida",
        "Hora sugerida de salida",
        "Turno que prepara (PM / Noche-AM)",
        "Chofer",
        "Unidad",
        "Renglones surtidos completos",
        "Cajas 1.5 kg / 21 kg",
        "Total de bultos al camión",
        "Incidencias de la orden completa",
        "Responsables (Alistó/Revisó/Documentó/Despachó)",
        "Recepción del cliente",
      ],
    },
    null,
    2,
  );
}

function asCamposRecord(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!Array.isArray(value)) {
    if (value && typeof value === "object") {
      for (const [key, raw] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (typeof raw === "string" && raw.trim()) {
          out[key.trim()] = raw.trim();
        }
      }
    }
    return out;
  }
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as { etiqueta?: unknown; valor?: unknown };
    const etiqueta =
      typeof row.etiqueta === "string" ? row.etiqueta.trim() : "";
    const valor = typeof row.valor === "string" ? row.valor.trim() : "";
    if (etiqueta && valor) out[etiqueta] = valor;
  }
  return out;
}

function normalizePayload(raw: unknown): OrdenSurtidoCapturaPayload {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const lineasRaw = Array.isArray(obj.lineas) ? obj.lineas : [];
  const lineas = lineasRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const indice = Number(row.indice);
      if (!Number.isFinite(indice) || indice < 1) return null;
      return {
        indice: Math.floor(indice),
        cantidadPreparada:
          typeof row.cantidadPreparada === "string"
            ? row.cantidadPreparada.trim() || null
            : null,
        codigoIncidencia:
          typeof row.codigoIncidencia === "string"
            ? row.codigoIncidencia.trim() || null
            : null,
        nota: typeof row.nota === "string" ? row.nota.trim() || null : null,
        alisto: typeof row.alisto === "boolean" ? row.alisto : null,
        reviso: typeof row.reviso === "boolean" ? row.reviso : null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  return {
    campos: asCamposRecord(obj.campos),
    lineas,
    observacionesIa:
      typeof obj.observacionesIa === "string"
        ? obj.observacionesIa.trim() || null
        : null,
  };
}

export async function extraerSurtidoDesdeFoto(input: {
  original: OrdenTareaAlmacenPrintData;
  mime: string;
  base64: string;
}): Promise<{ payload: OrdenSurtidoCapturaPayload; modelo: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Falta OPENAI_API_KEY en el entorno del servidor.");
  }

  const modelo =
    process.env.OPENAI_SURTIDO_MODEL?.trim() || OPENAI_SURTIDO_VISION_MODEL;
  const client = new OpenAI({ apiKey });
  const snapshot = buildOriginalSnapshot(input.original);

  const completion = await client.chat.completions.create({
    model: modelo,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "orden_surtido_captura",
        strict: true,
        schema: SURTIDO_SCHEMA,
      },
    },
    messages: [
      {
        role: "system",
        content:
          "Eres un lector experto de hojas de orden de venta de almacén impresas y llenadas a mano. " +
          "Comparas la foto de la hoja con el snapshot del PDF ORIGINAL (datos ya impresos). " +
          "Solo debes devolver lo que fue agregado a mano, marcado con bolígrafo/checkbox, o corregido sobre el papel. " +
          "No copies valores que ya estaban impresos en el original salvo que hayan sido claramente alterados a mano. " +
          "Si un campo manuscrito está vacío o ilegible, usa null. " +
          "Puedes llenar `campos` con CUALQUIER etiqueta visible en la hoja (factura, horas, chofer, responsables, recepción, totales, incidencias, etc.). " +
          "Para filas de producto usa `lineas` con el # de renglón.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Snapshot del PDF ORIGINAL (solo referencia de lo ya impreso):\n" +
              snapshot +
              "\n\nAnaliza la foto adjunta de la misma hoja ya surtida/llenada.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${input.mime};base64,${input.base64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI no devolvió contenido para la captura surtida.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("La respuesta de OpenAI no es JSON válido.");
  }

  return { payload: normalizePayload(parsed), modelo };
}
