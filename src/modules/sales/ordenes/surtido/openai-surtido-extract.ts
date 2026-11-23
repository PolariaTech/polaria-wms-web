import OpenAI from "openai";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";
import { configModeloSurtido } from "./surtido-modelo";
import { SURTIDO_SCHEMA } from "./openai-surtido-schema";
import {
  buildOriginalSnapshot,
  normalizePayload,
} from "./openai-surtido-normalize";

export async function extraerSurtidoDesdeFoto(input: {
  original: OrdenTareaAlmacenPrintData;
  mime: string;
  base64: string;
}): Promise<{ payload: OrdenSurtidoCapturaPayload; modelo: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Falta OPENAI_API_KEY en el entorno del servidor.");
  }

  const { modelo, parametros } = configModeloSurtido();
  const client = new OpenAI({ apiKey });
  const snapshot = buildOriginalSnapshot(input.original);

  const completion = await client.chat.completions.create({
    model: modelo,
    ...parametros,
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
          "PRIMERO evalúa calidadFoto (esHojaSurtido / hojaCompletaYLegible / motivo) con umbral LAXO. " +
          "Luego extrae TODO lo manuscrito y TODAS las casillas marcadas, mapeándolas a cabecera / checks / lineas. " +
          "Reglas:\n" +
          "0) calidadFoto (LAXO ~40%): esHojaSurtido=true si el sujeto es la hoja OV/surtido " +
          "(dedos/mesa al borde OK). hojaCompletaYLegible=true si se lee algo útil aunque el encuadre, " +
          "ángulo o luz no sean perfectos; false SOLO si casi nada se lee. " +
          "Rechaza esHojaSurtido=false solo si NO es esa hoja (selfie, caja, otro doc). " +
          "SIEMPRE intenta extraer manuscrito/checks aunque la foto sea imperfecta; no dejes todo null " +
          "solo por un ángulo o borde recortado.\n" +
          "1) Solo valores escritos o corregidos a mano, o checkboxes con X/✓/raya clara. NUNCA inventes.\n" +
          "2) No copies texto ya impreso (cliente, productos, cantidades solicitadas) salvo que se haya tachado/reescrito a mano.\n" +
          "3) Si un campo está vacío o ilegible → null. Si un checkbox está vacío → false; si no se ve → null.\n" +
          "4) facturaAsociada = SOLO el folio/número de factura manuscrito junto a la etiqueta «Folio factura asociada» " +
          "(arriba, cerca de cliente/# orden; antes «Factura asociada»). NUNCA pongas ahí un nombre de persona. " +
          "Los nombres van SOLO en las cajas de firma Alistó / Revisó / Factura (OK) o Documentación / Despachó / Retorno.\n" +
          "4b) COLOCACIÓN ESTRICTA POR CAJA (columna izquierda, de arriba a abajo): " +
          "Alistó → alistoNombre; Revisó → revisoNombre; " +
          "la caja «Factura (OK)» (hojas ya impresas) o «Documentación» (hojas nuevas) es la misma y va a facturaOkFolio/facturaOkFirma; " +
          "Despachó → despachoNombre/despachoHora; Retorno → retornoNombre. " +
          "SOLO asigna un valor al campo de la caja donde VES la tinta. " +
          "Si la caja está en blanco → null. NUNCA copies el mismo texto a otra caja «por si acaso». " +
          "NUNCA muevas un nombre de Despachó a Factura (OK) o Documentación ni de Alistó a Revisó si esa caja está vacía. " +
          "No confundas «Documentó» con «Documentación»: Documentó no llena facturaOk*.\n" +
          "4c) Nombres de firma: captura el nombre COMPLETO tal como está escrito (nombre + apellido). " +
          "No truncues a solo el apellido.\n" +
          "4d) Caja «Factura (OK)» o «Documentación» (mismo recuadro, rótulo viejo o nuevo; más alta que las demás): " +
          "esquina inferior IZQUIERDA (etiqueta Folio) → facturaOkFolio (número/código de factura, suele traer dígitos); " +
          "esquina inferior DERECHA (etiqueta Firma) → facturaOkFirma (nombre de persona, sin dígitos). " +
          "NUNCA pongas un nombre en facturaOkFolio ni un folio/número en facturaOkFirma. " +
          "Si solo hay tinta en un lado, llena SOLO ese lado; el otro → null.\n" +
          "4e) Despachó: inferior izquierda Firma → despachoNombre; inferior derecha Fecha → despachoHora. " +
          "No pongas la fecha de Despachó en Factura (OK) ni en Documentación.\n" +
          "5) Cabecera también: horaComprometida, horaSugeridaSalida, chofer, unidad, " +
          "renglonesSurtidosCompletos, cajas15kg, cajas21kg, totalBultosCamion, toleranciaPesoPct, recepción.\n" +
          "6) Si en el snapshot estaban vacíos y ahora hay manuscrito, llena también: " +
          "centroConsumo, fechaEntrega, numeroOrdenCliente, direccionEntrega.\n" +
          "7) Checks: turnoPm, turnoNocheAm; casillas de incidencia; mercancía; recepción.\n" +
          "7b) cabecera.incidencias: SOLO el texto del bloque inferior «Incidencias:». " +
          "NUNCA copies ahí la columna Especificación.\n" +
          "8) Filas de producto — ALINEACIÓN ESTRICTA:\n" +
          "   - Devuelve UNA linea por CADA producto del snapshot (también parciales / filas sin marca).\n" +
          "   - Usa el # y el nombre de producto del snapshot.\n" +
          "   - productoImpreso = nombre impreso de la fila donde VES el manuscrito/checkbox.\n" +
          "   - especificacion = SIEMPRE null (no leer manuscrito de esa columna; se conserva lo impreso).\n" +
          "   - Orden de columnas en cada fila: # | Producto | Especificación | Cant. | Alistó | Revisó.\n" +
          "   - alisto = SOLO el cuadrito ALISTÓ (penúltima columna, izquierda del par). " +
          "reviso = SOLO el cuadrito REVISÓ (última columna, derecha del par).\n" +
          "   - Las fotos suelen ser a mano/ángulo: busca chulos finos en bolígrafo azul/negro " +
          "dentro del cuadrito junto a «Cant.» (columna Alistó). Un ✓/X pequeño CUENTA → alisto=true.\n" +
          "   - Lee cada cuadrito por separado. Si solo Alistó tiene X/✓ → alisto=true y reviso=false. " +
          "NUNCA pongas reviso=true porque Alistó esté marcado. Cuadrito vacío → false.\n" +
          "   - Si la fila tiene producto impreso y ves marca en Alistó, NO dejes alisto=false.\n" +
          "9) En camposExtra mete cualquier otro texto manuscrito con su etiqueta visible.\n" +
          "10) Conserva unidades y formato (ej. «5 kg», «09:30»). No inventes valores.\n" +
          "11) Incidencias ≠ Especificación ≠ Folio factura asociada ≠ cajas de firma.",
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
              "Primero llena calidadFoto con criterio LAXO: acepta fotos imperfectas de la hoja " +
              "(~40%: se ve el papel y se lee algo). Solo marca esHojaSurtido=false si no es la hoja. " +
              "Luego llena cabecera, checks y lineas con TODO lo manuscrito y marcado. " +
              "Incluye UNA linea por cada producto del snapshot (parciales: filas sin marca → alisto=false, reviso=false). " +
              "Para cada linea incluye productoImpreso del snapshot de esa fila. " +
              "especificacion siempre null. Alinea checkboxes a la fila correcta por posición vertical. " +
              "Alistó y Revisó son dos cuadritos distintos: no copies uno al otro. " +
              "Prioridad máxima: cada manuscrito debe ir al campo de SU caja/etiqueta; " +
              "si dudas entre dos campos, deja null/false en el dudoso (mejor vacío que mal colocado).",
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