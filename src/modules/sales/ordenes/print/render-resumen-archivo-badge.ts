import type { jsPDF } from "jspdf";

export type TipoArchivoResumen = "pdf" | "html" | "excel";

interface PaletaIcono {
  fondo: readonly [number, number, number];
  borde: readonly [number, number, number];
}

const PALETA_TIPO: Record<TipoArchivoResumen, PaletaIcono> = {
  pdf: { fondo: [220, 38, 38], borde: [153, 27, 27] },
  html: { fondo: [37, 99, 235], borde: [29, 78, 216] },
  excel: { fondo: [22, 163, 74], borde: [21, 128, 61] },
};

/** Fondo amarillo suave para la fila completa cuando la OV sale sin archivo de OC (REQ-361). */
export const COLOR_FILA_SIN_ARCHIVO: readonly [number, number, number] = [254, 249, 195];

const ICONO_W = 3.8;
const ICONO_H = 4.4;
const ICONO_GAP = 1.2;

/** Pinta el fondo de la fila: amarillo si falta archivo de OC, gris alterno en filas impares. */
export function pintarFondoFilaResumen(
  doc: jsPDF,
  input: { x: number; y: number; ancho: number; alto: number; indice: number; sinArchivo?: boolean },
): void {
  if (input.sinArchivo) {
    doc.setFillColor(...COLOR_FILA_SIN_ARCHIVO);
    doc.rect(input.x, input.y, input.ancho, input.alto, "F");
  } else if (input.indice % 2 === 1) {
    doc.setFillColor(238, 238, 238);
    doc.rect(input.x, input.y, input.ancho, input.alto, "F");
  }
}

function restaurarTrazo(doc: jsPDF): void {
  doc.setTextColor(0);
  doc.setDrawColor(0);
  doc.setLineWidth(0.35);
}

/** Dibuja una hoja con esquina superior derecha doblada. */
function dibujarHojaBase(doc: jsPDF, x: number, y: number, paleta: PaletaIcono): void {
  const doblez = 1.1;
  doc.setFillColor(...paleta.fondo);
  doc.setDrawColor(...paleta.borde);
  doc.setLineWidth(0.24);
  doc.roundedRect(x, y, ICONO_W, ICONO_H, 0.45, 0.45, "FD");
  doc.setFillColor(255, 255, 255);
  doc.triangle(x + ICONO_W - doblez, y, x + ICONO_W, y, x + ICONO_W, y + doblez, "F");
  doc.line(x + ICONO_W - doblez, y, x + ICONO_W - doblez, y + doblez);
  doc.line(x + ICONO_W - doblez, y + doblez, x + ICONO_W, y + doblez);
}

function dibujarSimboloTipo(doc: jsPDF, tipo: TipoArchivoResumen, x: number, y: number): void {
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.28);
  const cy = y + ICONO_H * 0.62;
  if (tipo === "pdf") {
    doc.line(x + 0.85, cy - 0.85, x + ICONO_W - 0.85, cy - 0.85);
    doc.line(x + 0.85, cy, x + ICONO_W - 0.85, cy);
    doc.line(x + 0.85, cy + 0.85, x + ICONO_W - 1.35, cy + 0.85);
    return;
  }
  if (tipo === "html") {
    // Símbolo </> en líneas blancas.
    doc.line(x + 1.3, cy - 0.65, x + 0.75, cy);
    doc.line(x + 0.75, cy, x + 1.3, cy + 0.65);
    doc.line(x + 2.05, cy - 0.75, x + 1.75, cy + 0.75);
    doc.line(x + 2.5, cy - 0.65, x + 3.05, cy);
    doc.line(x + 3.05, cy, x + 2.5, cy + 0.65);
    return;
  }
  // Cuadrícula 2x2 para Excel.
  const gx = x + 0.85;
  const gy = cy - 0.95;
  const gw = ICONO_W - 1.7;
  const gh = 1.9;
  doc.rect(gx, gy, gw, gh, "S");
  doc.line(gx + gw / 2, gy, gx + gw / 2, gy + gh);
  doc.line(gx, gy + gh / 2, gx + gw, gy + gh / 2);
}

/** Triángulo ámbar con signo de exclamación para OV sin archivo de OC. */
function dibujarIconoAlerta(doc: jsPDF, cx: number, cy: number): void {
  const halfW = 2.25;
  const topY = cy - 2.05;
  const botY = cy + 1.95;
  doc.setFillColor(245, 158, 11);
  doc.setDrawColor(180, 83, 9);
  doc.setLineWidth(0.28);
  doc.triangle(cx, topY, cx - halfW, botY, cx + halfW, botY, "FD");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.42);
  doc.line(cx, topY + 1.35, cx, botY - 1.15);
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, botY - 0.6, 0.24, "F");
  restaurarTrazo(doc);
}

/**
 * REQ-361: dibuja en la celda «Archivo» el ícono vectorial del archivo fuente (PDF rojo,
 * HTML azul con `</>`, Excel verde con cuadrícula) o un triángulo de alerta si no tiene archivo.
 */
export function dibujarCeldaArchivo(
  doc: jsPDF,
  input: {
    x: number;
    y: number;
    ancho: number;
    alto: number;
    tipos?: readonly TipoArchivoResumen[];
    sinArchivo?: boolean;
  },
): void {
  const { x, y, ancho, alto, tipos, sinArchivo } = input;
  if (sinArchivo) {
    dibujarIconoAlerta(doc, x + ancho / 2, y + alto / 2);
    return;
  }

  const unicos = [...new Set(tipos ?? [])];
  if (unicos.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("—", x + ancho / 2, y + alto / 2, { align: "center", baseline: "middle" });
    return;
  }

  const totalW = unicos.length * ICONO_W + (unicos.length - 1) * ICONO_GAP;
  let cursorX = x + (ancho - totalW) / 2;
  const iconoY = y + (alto - ICONO_H) / 2;
  for (const tipo of unicos) {
    dibujarHojaBase(doc, cursorX, iconoY, PALETA_TIPO[tipo]);
    dibujarSimboloTipo(doc, tipo, cursorX, iconoY);
    cursorX += ICONO_W + ICONO_GAP;
  }
  restaurarTrazo(doc);
}
