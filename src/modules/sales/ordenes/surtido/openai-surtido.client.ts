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
  "centroConsumo",
  "fechaEntrega",
  "numeroOrdenCliente",
  "direccionEntrega",
  "notasGenerales",
  "incidencias",
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
  "facturaOkNombre",
  "facturaOkHora",
  "despachoNombre",
  "despachoHora",
  "retornoNombre",
  "retornoHora",
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
  centroConsumo: "Centro de consumo / cocina",
  fechaEntrega: "Fecha de entrega",
  numeroOrdenCliente: "# de orden del cliente",
  direccionEntrega: "Dirección de entrega",
  notasGenerales: "Notas generales",
  incidencias: "Incidencias",
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
  facturaOkNombre: "Factura (OK) nombre",
  facturaOkHora: "Factura (OK) hora",
  despachoNombre: "Despachó nombre",
  despachoHora: "Despachó hora",
  retornoNombre: "Retorno nombre",
  retornoHora: "Retorno hora",
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
          "productoImpreso",
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
          productoImpreso: {
            ...NULLABLE_STRING,
            description:
              "Nombre del producto IMPRESO de la misma fila donde está el manuscrito/checkbox (copiar del snapshot). Obliga a alinear la fila correcta.",
          },
          especificacion: {
            ...NULLABLE_STRING,
            description:
              "Texto manuscrito SOLO en la columna Especificación de esa misma fila (misma banda horizontal del producto). null si vacío. NUNCA uses el bloque Incidencias ni muevas el texto a otra fila.",
          },
          cantidadPreparada: NULLABLE_STRING,
          codigoIncidencia: {
            ...NULLABLE_STRING,
            description: "Código A–F (u otro) escrito en Cód.",
          },
          nota: NULLABLE_STRING,
          alisto: {
            ...NULLABLE_BOOL,
            description:
              "Checkbox Alistó de ESA fila (columna derecha). true si hay X/✓/marca en el cuadrito de la fila; false si vacío.",
          },
          reviso: {
            ...NULLABLE_BOOL,
            description:
              "Checkbox Revisó de ESA fila (columna derecha). true si hay X/✓/marca en el cuadrito de la fila; false si vacío.",
          },
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
      horaEntrega: original.horaEntrega,
      direccionEntrega: original.direccionEntrega,
      notasGenerales: original.notasGenerales,
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

function normalizeProductoKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function campoValor(
  campos: Record<string, string>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const valor = campos[key]?.trim();
    if (valor) return valor;
  }
  return undefined;
}

function clearCampo(campos: Record<string, string>, ...keys: string[]): void {
  for (const key of keys) delete campos[key];
}

function setCampoNombre(
  campos: Record<string, string>,
  canonical: (typeof CABECERA_KEYS)[number],
  valor: string,
): void {
  campos[canonical] = valor;
  campos[CABECERA_LABELS[canonical]] = valor;
}

/** Factura asociada ≠ firmas: no debe llevar nombres de Alistó/Revisó/Despachó/etc. */
export function sanitizeFacturaAsociada(
  campos: Record<string, string>,
): void {
  const factura = campoValor(campos, "facturaAsociada", "Factura asociada");
  if (!factura) return;

  const firmas = [
    campoValor(campos, "alistoNombre", "Alistó nombre", "Alistó"),
    campoValor(campos, "revisoNombre", "Revisó nombre", "Revisó"),
    campoValor(campos, "facturaOkNombre", "Factura (OK) nombre"),
    campoValor(campos, "documentoNombre", "Documentó nombre"),
    campoValor(campos, "despachoNombre", "Despachó nombre", "Despachó"),
    campoValor(campos, "despachoFirma", "Despachó firma"),
    campoValor(campos, "retornoNombre", "Retorno nombre", "Retorno"),
  ]
    .filter((v): v is string => Boolean(v))
    .map((v) => normalizeProductoKey(v));

  const facturaKey = normalizeProductoKey(factura);
  const coincideFirma = firmas.some(
    (firma) =>
      facturaKey === firma ||
      firma.includes(facturaKey) ||
      facturaKey.includes(firma),
  );
  // Nº de factura suele traer dígitos; un nombre de persona sin dígitos es basura típica.
  const pareceNombreSinFolio =
    !/\d/.test(factura) && /^[\p{L}\s.'’-]+$/u.test(factura.trim());

  if (coincideFirma || pareceNombreSinFolio) {
    clearCampo(campos, "facturaAsociada", "Factura asociada", "factura");
  }
}

/** Si Revisó (u otro) solo trajo el apellido y otro campo tiene el nombre completo, completa. */
export function expandNombresParcialesFirmas(
  campos: Record<string, string>,
): void {
  const candidatos = [
    campoValor(campos, "alistoNombre", "Alistó nombre", "Alistó"),
    campoValor(campos, "despachoNombre", "Despachó nombre", "Despachó"),
    campoValor(campos, "despachoFirma", "Despachó firma"),
    campoValor(campos, "retornoNombre", "Retorno nombre", "Retorno"),
    campoValor(campos, "facturaOkNombre", "Factura (OK) nombre"),
  ].filter((v): v is string => Boolean(v));

  const targets: Array<{
    canonical: (typeof CABECERA_KEYS)[number];
    keys: string[];
  }> = [
    {
      canonical: "revisoNombre",
      keys: ["revisoNombre", "Revisó nombre", "Revisó"],
    },
    {
      canonical: "alistoNombre",
      keys: ["alistoNombre", "Alistó nombre", "Alistó"],
    },
    {
      canonical: "facturaOkNombre",
      keys: ["facturaOkNombre", "Factura (OK) nombre"],
    },
    {
      canonical: "retornoNombre",
      keys: ["retornoNombre", "Retorno nombre", "Retorno"],
    },
  ];

  for (const target of targets) {
    const actual = campoValor(campos, ...target.keys);
    if (!actual) continue;
    const tokens = actual.trim().split(/\s+/);
    if (tokens.length !== 1) continue;
    const tokenKey = normalizeProductoKey(tokens[0] ?? "");
    if (!tokenKey) continue;

    for (const candidato of candidatos) {
      if (normalizeProductoKey(candidato) === normalizeProductoKey(actual)) {
        continue;
      }
      const parts = candidato.trim().split(/\s+/);
      if (parts.length < 2) continue;
      if (parts.some((p) => normalizeProductoKey(p) === tokenKey)) {
        setCampoNombre(campos, target.canonical, candidato.trim());
        break;
      }
    }
  }
}

type LineaRawCaptura = {
  indice: number;
  productoImpreso: string | null;
  especificacion: string | null;
  cantidadPreparada: string | null;
  codigoIncidencia: string | null;
  nota: string | null;
  alisto: boolean | null;
  reviso: boolean | null;
};

/** Reescribe indice usando productoImpreso del snapshot cuando el modelo desfasó la fila. */
export function remapLineasPorProducto(
  lineas: LineaRawCaptura[],
  original: OrdenTareaAlmacenPrintData,
): OrdenSurtidoCapturaPayload["lineas"] {
  const byKey = new Map<string, number>();
  original.lineas.forEach((linea, index) => {
    const key = normalizeProductoKey(linea.producto || "");
    if (key && !byKey.has(key)) byKey.set(key, index + 1);
  });

  const merged = new Map<number, OrdenSurtidoCapturaPayload["lineas"][number]>();

  for (const row of lineas) {
    let indice = row.indice;
    const productoKey = row.productoImpreso
      ? normalizeProductoKey(row.productoImpreso)
      : "";
    if (productoKey) {
      const matched = byKey.get(productoKey);
      if (matched) {
        indice = matched;
      } else {
        // Match parcial: "BLUE BERRY" ↔ "BLUEBERRY" o contiene
        for (const [key, idx] of byKey) {
          if (key.includes(productoKey) || productoKey.includes(key)) {
            indice = idx;
            break;
          }
        }
      }
    }

    const prev = merged.get(indice);
    const mergeBool = (
      a: boolean | null | undefined,
      b: boolean | null | undefined,
    ): boolean | null => {
      if (a === true || b === true) return true;
      if (a === false || b === false) return false;
      return a ?? b ?? null;
    };
    merged.set(indice, {
      indice,
      especificacion: row.especificacion ?? prev?.especificacion ?? null,
      cantidadPreparada:
        row.cantidadPreparada ?? prev?.cantidadPreparada ?? null,
      codigoIncidencia: row.codigoIncidencia ?? prev?.codigoIncidencia ?? null,
      nota: row.nota ?? prev?.nota ?? null,
      alisto: mergeBool(row.alisto, prev?.alisto),
      reviso: mergeBool(row.reviso, prev?.reviso),
    });
  }

  return [...merged.values()].sort((a, b) => a.indice - b.indice);
}

export function refineSurtidoPayload(
  payload: OrdenSurtidoCapturaPayload,
): OrdenSurtidoCapturaPayload {
  const campos = { ...payload.campos };
  sanitizeFacturaAsociada(campos);
  expandNombresParcialesFirmas(campos);
  return { ...payload, campos };
}

function normalizePayload(
  raw: unknown,
  original: OrdenTareaAlmacenPrintData,
): OrdenSurtidoCapturaPayload {
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
  const lineasParsed: LineaRawCaptura[] = lineasRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const indice = Number(row.indice);
      if (!Number.isFinite(indice) || indice < 1) return null;
      return {
        indice: Math.floor(indice),
        productoImpreso: asNullableString(row.productoImpreso),
        especificacion: asNullableString(row.especificacion),
        cantidadPreparada: asNullableString(row.cantidadPreparada),
        codigoIncidencia: asNullableString(row.codigoIncidencia),
        nota: asNullableString(row.nota),
        alisto: asNullableBool(row.alisto),
        reviso: asNullableBool(row.reviso),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  const base: OrdenSurtidoCapturaPayload = {
    campos,
    checks,
    lineas: remapLineasPorProducto(lineasParsed, original),
    observacionesIa: asNullableString(obj.observacionesIa),
    precisionEstimada: null,
  };

  sanitizeFacturaAsociada(base.campos);
  expandNombresParcialesFirmas(base.campos);
  return base;
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
          "1) Solo valores escritos o corregidos a mano, o checkboxes con X/✓/raya clara. NUNCA inventes.\n" +
          "2) No copies texto ya impreso (cliente, productos, cantidades solicitadas) salvo que se haya tachado/reescrito a mano.\n" +
          "3) Si un campo está vacío o ilegible → null. Si un checkbox está vacío → false; si no se ve → null.\n" +
          "4) facturaAsociada = SOLO el folio/número de factura manuscrito junto a la etiqueta «Factura asociada» " +
          "(arriba, cerca de cliente/# orden). NUNCA pongas ahí un nombre de persona. " +
          "Los nombres van SOLO en las cajas de firma Alistó / Revisó / Factura (OK) / Despachó / Retorno.\n" +
          "4b) Cajas de firma independientes: lee CADA caja por separado. Si una caja está en blanco → null. " +
          "NO copies el nombre de Despachó/Alistó a Factura (OK), Revisó u otras cajas vacías.\n" +
          "4c) Nombres de firma: captura el nombre COMPLETO tal como está escrito (nombre + apellido). " +
          "No truncues a solo el apellido.\n" +
          "5) Cabecera también: horaComprometida, horaSugeridaSalida, chofer, unidad, " +
          "renglonesSurtidosCompletos, cajas15kg, cajas21kg, totalBultosCamion, toleranciaPesoPct, recepción.\n" +
          "6) Si en el snapshot estaban vacíos y ahora hay manuscrito, llena también: " +
          "centroConsumo, fechaEntrega, numeroOrdenCliente, direccionEntrega.\n" +
          "7) Checks: turnoPm, turnoNocheAm; casillas de incidencia; mercancía; recepción.\n" +
          "7b) cabecera.incidencias: SOLO el texto del bloque inferior «Incidencias:». " +
          "NUNCA copies ahí la columna Especificación.\n" +
          "8) Filas de producto — ALINEACIÓN ESTRICTA:\n" +
          "   - Usa el # y el nombre de producto del snapshot.\n" +
          "   - productoImpreso = nombre impreso de la fila donde VES el manuscrito/checkbox.\n" +
          "   - especificacion = texto manuscrito en la columna Especificación de ESA misma fila " +
          "(misma banda horizontal). Si «grandes» está a la altura de BLUE BERRY → indice de BLUE BERRY, " +
          "NO de la fila de abajo.\n" +
          "   - alisto/reviso = checkboxes de la DERECHA de ESA misma fila. Revisa fila por fila " +
          "(incluida la #1); cualquier X/✓/marca dentro del cuadrito → true.\n" +
          "9) En camposExtra mete cualquier otro texto manuscrito con su etiqueta visible.\n" +
          "10) Conserva unidades y formato (ej. «5 kg», «09:30»). No inventes valores.\n" +
          "11) Incidencias ≠ Especificación ≠ Factura asociada ≠ cajas de firma.",
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
              "Llena cabecera, checks y lineas con TODO lo manuscrito y marcado. " +
              "Para cada linea incluye productoImpreso del snapshot de esa fila. " +
              "Alinea especificacion y checkboxes a la fila correcta por posición vertical.",
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

  return { payload: normalizePayload(parsed, input.original), modelo };
}
