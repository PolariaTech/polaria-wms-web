import OpenAI from "openai";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type {
  OrdenSurtidoCapturaPayload,
  OrdenSurtidoChecks,
} from "./orden-surtido.types";

/** Visión de alta calidad para manuscrito en hoja impresa. */
export const OPENAI_SURTIDO_VISION_MODEL = "gpt-4o";

const NULLABLE_STRING = { type: ["string", "null"] as const };
const NULLABLE_BOOL = { type: ["boolean", "null"] as const };

const CABECERA_KEYS = [
  "facturaAsociada",
  "horaComprometida",
  "horaSugeridaSalida",
  "chofer",
  "unidad",
  "renglonesSurtidosCompletos",
  "cajas15kg",
  "cajas21kg",
  "totalBultosCamion",
  "toleranciaPesoPct",
  "alistoNombre",
  "alistoHora",
  "revisoNombre",
  "revisoHora",
  "documentoNombre",
  "documentoHora",
  "despachoNombre",
  "despachoHora",
  "recepcionNombre",
  "recepcionCargo",
  "recepcionHora",
  "recepcionMotivo",
] as const;

const CHECK_KEYS = [
  "turnoPm",
  "turnoNocheAm",
  "incidenciaFueraHorario",
  "incidenciaSinFactura",
  "incidenciaFacturaNoPedida",
  "incidenciaNinguna",
  "mercanciaCoincide",
  "mercanciaDentroTolerancia",
  "mercanciaFueraTolerancia",
  "recepcionAceptadoCompleto",
  "recepcionAceptadoParcial",
  "recepcionRechazado",
  "recepcionRetornoFactura",
] as const;

/** Etiquetas humanas para PDF / búsqueda flexible. */
export const CABECERA_LABELS: Record<(typeof CABECERA_KEYS)[number], string> = {
  facturaAsociada: "Factura asociada",
  horaComprometida: "Hora comprometida",
  horaSugeridaSalida: "Hora sugerida de salida",
  chofer: "Chofer",
  unidad: "Unidad",
  renglonesSurtidosCompletos: "Renglones surtidos completos",
  cajas15kg: "Cajas 1.5 kg",
  cajas21kg: "Cajas 21 kg",
  totalBultosCamion: "Total de bultos al camión",
  toleranciaPesoPct: "Tolerancia por peso %",
  alistoNombre: "Alistó nombre",
  alistoHora: "Alistó hora",
  revisoNombre: "Revisó nombre",
  revisoHora: "Revisó hora",
  documentoNombre: "Documentó nombre",
  documentoHora: "Documentó hora",
  despachoNombre: "Despachó nombre",
  despachoHora: "Despachó hora",
  recepcionNombre: "Recepción nombre",
  recepcionCargo: "Recepción cargo",
  recepcionHora: "Recepción hora",
  recepcionMotivo: "Recepción motivo",
};

const SURTIDO_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["cabecera", "checks", "lineas", "camposExtra", "observacionesIa"],
  properties: {
    cabecera: {
      type: "object",
      additionalProperties: false,
      required: [...CABECERA_KEYS],
      properties: Object.fromEntries(
        CABECERA_KEYS.map((key) => [key, NULLABLE_STRING]),
      ),
      description:
        "Todos los campos de texto manuscritos de cabecera, totales, responsables y recepción.",
    },
    checks: {
      type: "object",
      additionalProperties: false,
      required: [...CHECK_KEYS],
      properties: Object.fromEntries(
        CHECK_KEYS.map((key) => [key, NULLABLE_BOOL]),
      ),
      description:
        "Casillas: true si hay X/✓/marca clara; false si el cuadro está vacío; null si no se ve o es ambiguo.",
    },
    lineas: {
      type: "array",
      description:
        "Solo filas de producto con algo manuscrito o checkbox marcado. indice = # de la tabla (1-based).",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "indice",
          "especificacion",
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
          especificacion: {
            ...NULLABLE_STRING,
            description:
              "Texto manuscrito en la columna Especificación (null si no hay nada escrito a mano).",
          },
          cantidadPreparada: NULLABLE_STRING,
          codigoIncidencia: {
            ...NULLABLE_STRING,
            description: "Código A–F (u otro) escrito en Cód.",
          },
          nota: NULLABLE_STRING,
          alisto: NULLABLE_BOOL,
          reviso: NULLABLE_BOOL,
        },
      },
    },
    camposExtra: {
      type: "array",
      description:
        "Cualquier otro texto manuscrito que no encaje en cabecera/checks/lineas.",
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
    observacionesIa: {
      ...NULLABLE_STRING,
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
        especificacionImpresa: linea.especificacion || "(vacío)",
        cantidadSolicitada: linea.cantidadSolicitada,
        cantidadPreparada: "(vacío en original — leer manuscrito)",
        codigoIncidencia: "(vacío — leer A–F si hay)",
        nota: "(vacío — leer manuscrito)",
        alisto: "(checkbox vacío)",
        reviso: "(checkbox vacío)",
      })),
      camposManuscritosEsperados: {
        cabecera: [...CABECERA_KEYS],
        checks: [...CHECK_KEYS],
        porLinea: [
          "especificacion",
          "cantidadPreparada",
          "codigoIncidencia",
          "nota",
          "alisto",
          "reviso",
        ],
      },
    },
    null,
    2,
  );
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asNullableBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asCamposExtra(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!Array.isArray(value)) return out;
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

  const cabeceraRaw =
    obj.cabecera && typeof obj.cabecera === "object"
      ? (obj.cabecera as Record<string, unknown>)
      : {};
  const checksRaw =
    obj.checks && typeof obj.checks === "object"
      ? (obj.checks as Record<string, unknown>)
      : {};

  const campos: Record<string, string> = {
    ...asCamposExtra(obj.camposExtra),
    // Compat: si el modelo viejo aún manda `campos` array/objeto
    ...asCamposExtra(
      Array.isArray(obj.campos)
        ? obj.campos
        : Object.entries(
            obj.campos && typeof obj.campos === "object"
              ? (obj.campos as Record<string, unknown>)
              : {},
          ).map(([etiqueta, valor]) => ({ etiqueta, valor })),
    ),
  };

  for (const key of CABECERA_KEYS) {
    const valor = asNullableString(cabeceraRaw[key]);
    if (!valor) continue;
    campos[key] = valor;
    campos[CABECERA_LABELS[key]] = valor;
  }

  // Combinar cajas en una sola etiqueta usada por el PDF
  const cajas15 = campos.cajas15kg || campos["Cajas 1.5 kg"];
  const cajas21 = campos.cajas21kg || campos["Cajas 21 kg"];
  if (cajas15 || cajas21) {
    const combo = [cajas15 || "—", cajas21 || "—"].join(" / ");
    campos["Cajas 1.5 kg / 21 kg"] = combo;
    campos.cajas15kg21kg = combo;
  }

  const checks: OrdenSurtidoChecks = {};
  for (const key of CHECK_KEYS) {
    const valor = asNullableBool(checksRaw[key]);
    if (valor != null) checks[key] = valor;
  }

  const lineasRaw = Array.isArray(obj.lineas) ? obj.lineas : [];
  const lineas = lineasRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const indice = Number(row.indice);
      if (!Number.isFinite(indice) || indice < 1) return null;
      return {
        indice: Math.floor(indice),
        especificacion: asNullableString(row.especificacion),
        cantidadPreparada: asNullableString(row.cantidadPreparada),
        codigoIncidencia: asNullableString(row.codigoIncidencia),
        nota: asNullableString(row.nota),
        alisto: asNullableBool(row.alisto),
        reviso: asNullableBool(row.reviso),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  return {
    campos,
    checks,
    lineas,
    observacionesIa: asNullableString(obj.observacionesIa),
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
          "Eres un lector experto de hojas de ORDEN DE VENTA de almacén impresas y llenadas a mano (bolígrafo). " +
          "Comparas la foto con el snapshot del PDF ORIGINAL. " +
          "Debes extraer TODO lo manuscrito y TODAS las casillas marcadas, mapeándolas a cabecera / checks / lineas. " +
          "Reglas:\n" +
          "1) Solo valores escritos o corregidos a mano, o checkboxes con X/✓/raya clara.\n" +
          "2) No copies texto ya impreso (cliente, dirección, productos, cantidades solicitadas) salvo que se haya tachado/reescrito a mano.\n" +
          "3) Si un campo está vacío o ilegible → null. Si un checkbox está vacío → false; si no se ve → null.\n" +
          "4) Cabecera: facturaAsociada, horaComprometida, horaSugeridaSalida, chofer, unidad, " +
          "renglonesSurtidosCompletos, cajas15kg, cajas21kg, totalBultosCamion, toleranciaPesoPct, " +
          "nombres y horas de Alistó/Revisó/Documentó/Despachó, y recepción (nombre, cargo, hora, motivo).\n" +
          "5) Checks: turnoPm, turnoNocheAm; incidencias de la orden; mercancía coincide / dentro / fuera de tolerancia; recepción.\n" +
          "6) Por cada fila de producto con marcas: indice (#), especificacion manuscrita, cantidadPreparada, " +
          "codigoIncidencia (A–F), nota, alisto, reviso.\n" +
          "7) En camposExtra mete cualquier otro texto manuscrito con su etiqueta visible.\n" +
          "8) Conserva unidades y formato (ej. «5 kg», «09:30», «PM»). No inventes valores.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Snapshot del PDF ORIGINAL (referencia de lo ya impreso):\n" +
              snapshot +
              "\n\nAnaliza la foto adjunta de la misma hoja ya surtida/llenada. " +
              "Llena cabecera, checks y lineas con TODO lo manuscrito y marcado.",
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
