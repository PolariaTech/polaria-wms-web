export const PATRON_OT_NUEVA = /^NUEVA-\d+$/;
export const ETIQUETA_OT_NUEVA_POR_DEFECTO = "Nueva orden de trabajo";
export const MAX_ETIQUETA_OT = 60;
export const ESCALA_CANTIDAD = 1_000_000;

export function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

export function parseCantidadRenglon(valor: number | string | undefined): number {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor === "string") {
    const numero = Number(valor.replace(",", ".").trim());
    return Number.isFinite(numero) ? numero : 0;
  }
  return 0;
}

export function aEscala(cantidad: number): number {
  return Math.round(cantidad * ESCALA_CANTIDAD);
}

export function sanitizarEtiqueta(valor: string | null | undefined): string {
  const limpia = Array.from(valor ?? "", (caracter) => {
    const codigo = caracter.codePointAt(0) ?? 0;
    return codigo <= 0x1f || (codigo >= 0x7f && codigo <= 0x9f) ? " " : caracter;
  })
    .join("")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return Array.from(limpia).slice(0, MAX_ETIQUETA_OT).join("");
}

export function generarIdOtManual(): string {
  const uuid =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `ot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `manual:${uuid}`;
}

export function mismoValorOVacio(valores: string[]): string {
  const distintos = new Set(valores.map((valor) => valor.trim()).filter(Boolean));
  return distintos.size === 1 ? [...distintos][0]! : "";
}