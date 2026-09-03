import type { CompradorAltaFicha } from "@/modules/admin-panel/compradores/utils/comprador-alta";

export interface OrdenVentaCompradorPrefill {
  moneda: string;
  centroConsumo: string;
  ventanaDesde: string;
  ventanaHasta: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  aceptaSustituciones: string;
  requiereLote: string;
  registrarTemperatura: string;
  observaciones: string;
  exigeOc: boolean;
}

const MONEDAS = new Set(["MXN", "USD"]);

const SUSTITUCIONES = new Set([
  "No — surtir parcial",
  "Sí, con aviso",
  "Sí, a criterio de almacén",
]);

const SI_NO = new Set(["Sí", "No"]);

function text(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function matchOption(value: string, allowed: Set<string>): string {
  const trimmed = text(value);
  if (!trimmed) return "";
  if (allowed.has(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  for (const option of allowed) {
    if (option.toLowerCase() === lower) return option;
  }
  return "";
}

function joinAddress(centro: CompradorAltaFicha["centros"][number] | undefined): string {
  if (!centro) return "";
  const parts = [text(centro.direccion)];
  if (text(centro.cp)) parts.push(`CP ${text(centro.cp)}`);
  if (text(centro.carreteraFederal)) parts.push(text(centro.carreteraFederal));
  return parts.filter(Boolean).join(" · ");
}

function buildObservaciones(ficha: CompradorAltaFicha): string {
  const centro = ficha.centros[0];
  const lines: string[] = [];

  if (text(centro?.notas)) lines.push(text(centro?.notas));
  if (text(ficha.tolerancia)) lines.push(`Tolerancia de peso: ${text(ficha.tolerancia)}`);
  if (text(ficha.vidaUtil)) {
    lines.push(`Vida útil mínima al entregar: ${text(ficha.vidaUtil)} días`);
  }
  if (text(ficha.requiereFicha) === "Sí") {
    lines.push("Requiere ficha técnica del producto");
  }
  if (text(ficha.politicaDevolucion)) {
    lines.push(`Rechazo / devolución: ${text(ficha.politicaDevolucion)}`);
  }

  return lines.join("\n");
}

/**
 * Traduce la ficha del comprador a campos del pedido.
 * Solo rellena lo que el hotel ya definió; el resto queda vacío para captura.
 */
export function buildOrdenVentaPrefillFromComprador(params: {
  ficha: CompradorAltaFicha;
  telefonoComprador?: string | null;
}): OrdenVentaCompradorPrefill {
  const { ficha, telefonoComprador } = params;
  const centro = ficha.centros[0];
  const contactoFicha = ficha.contactos[0];

  const moneda = matchOption(ficha.moneda, MONEDAS) || "MXN";
  const direccion = joinAddress(centro);
  const contacto =
    text(centro?.contacto) ||
    text(contactoFicha?.nombre) ||
    "";
  const telefono =
    text(centro?.telefono) ||
    text(contactoFicha?.telefono) ||
    text(telefonoComprador) ||
    text(ficha.whatsapp);

  return {
    moneda,
    centroConsumo: text(centro?.nombre),
    ventanaDesde: text(centro?.desde),
    ventanaHasta: text(centro?.hasta),
    direccion,
    anden: text(centro?.anden),
    contacto,
    telefono,
    aceptaSustituciones: matchOption(ficha.sustituciones, SUSTITUCIONES),
    requiereLote: matchOption(ficha.requiereLote, SI_NO),
    registrarTemperatura: matchOption(ficha.requiereTemp, SI_NO),
    observaciones: buildObservaciones(ficha),
    exigeOc: text(ficha.exigeOc) === "Sí",
  };
}
