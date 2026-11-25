const NULLABLE_STRING = { type: ["string", "null"] as const };
const NULLABLE_BOOL = { type: ["boolean", "null"] as const };

export const CABECERA_KEYS = [
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
  "facturaOkFolio",
  "facturaOkFirma",
  "despachoNombre",
  "despachoHora",
  "retornoNombre",
  "retornoHora",
  "recepcionNombre",
  "recepcionCargo",
  "recepcionHora",
  "recepcionMotivo",
] as const;

export const CHECK_KEYS = [
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
  facturaAsociada: "Folio factura asociada",
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
  facturaOkFolio: "Factura (OK) folio",
  facturaOkFirma: "Factura (OK) firma",
  despachoNombre: "Despachó nombre",
  despachoHora: "Despachó hora",
  retornoNombre: "Retorno nombre",
  retornoHora: "Retorno hora",
  recepcionNombre: "Recepción nombre",
  recepcionCargo: "Recepción cargo",
  recepcionHora: "Recepción hora",
  recepcionMotivo: "Recepción motivo",
};

export const SURTIDO_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "calidadFoto",
    "cabecera",
    "checks",
    "lineas",
    "camposExtra",
    "observacionesIa",
  ],
  properties: {
    calidadFoto: {
      type: "object",
      additionalProperties: false,
      required: ["esHojaSurtido", "hojaCompletaYLegible", "motivo"],
      properties: {
        esHojaSurtido: {
          type: "boolean",
          description:
            "true si el sujeto PRINCIPAL es la hoja impresa de ORDEN DE VENTA / surtido de almacén. " +
            "Puede haber dedos/mesa al borde. false SOLO si NO es esa hoja (selfie, caja, scanner vacío, " +
            "otra factura, solo manos/resaltador sin la OV).",
        },
        hojaCompletaYLegible: {
          type: "boolean",
          description:
            "Umbral LAXO (~40%): true si se reconoce la hoja y se puede leer ALGO útil " +
            "(productos, checks, firmas o cabecera), aunque el ángulo, luz, recorte parcial o " +
            "hora impresa no sean perfectos. false SOLO si la hoja está tan mal que casi nada se lee.",
        },
        motivo: {
          type: "string",
          description:
            "Si esHojaSurtido es false, o ambas flags fallan: una frase corta en español. " +
            "Si esHojaSurtido es true (aunque hojaCompletaYLegible sea false por imperfección leve): " +
            "puedes dejar vacío o una nota breve; no inventes rechazo duro.",
        },
      },
    },
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
        "UNA entrada por CADA fila de producto del snapshot (parciales incluidos). " +
        "indice = # de la tabla (1-based). Si la fila no tiene manuscrito ni marca → alisto=false, reviso=false y resto null.",
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
              "Siempre null. La columna Especificación NO se lee del manuscrito; se conserva la impresa del pedido. No copies texto a mano de esa columna.",
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
              "Checkbox ALISTÓ de ESA fila: penúltima columna de la tabla, " +
              "a la IZQUIERDA del par Alistó|Revisó (justo a la derecha de Cant.). " +
              "true SOLO si hay X/✓/marca DENTRO de ese cuadrito; false si está vacío. " +
              "NUNCA copies el valor de reviso ni marques alisto porque veas marca en Revisó.",
          },
          reviso: {
            ...NULLABLE_BOOL,
            description:
              "Checkbox REVISÓ de ESA fila: ÚLTIMA columna de la tabla, " +
              "a la DERECHA del par Alistó|Revisó (borde derecho de la fila). " +
              "true SOLO si hay X/✓/marca DENTRO de ese cuadrito; false si está vacío. " +
              "NUNCA copies el valor de alisto: si solo Alistó tiene marca → reviso=false.",
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