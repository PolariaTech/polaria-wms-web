import { CABECERA_KEYS, CABECERA_LABELS } from "./openai-surtido-schema";

export function normalizeProductoKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

export function campoValor(
  campos: Record<string, string>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const valor = campos[key]?.trim();
    if (valor) return valor;
  }
  return undefined;
}

export function clearCampo(campos: Record<string, string>, ...keys: string[]): void {
  for (const key of keys) delete campos[key];
}

export function setCampoNombre(
  campos: Record<string, string>,
  canonical: (typeof CABECERA_KEYS)[number],
  valor: string,
): void {
  campos[canonical] = valor;
  campos[CABECERA_LABELS[canonical]] = valor;
}

export function pareceFolioManuscrito(valor: string): boolean {
  const t = valor.trim();
  if (!t) return false;
  if (/\d/.test(t)) return true;
  return /^[A-Z]{1,5}[-/._][A-Z0-9]+$/i.test(t);
}

export function pareceNombrePersona(valor: string): boolean {
  const t = valor.trim();
  if (!t || /\d/.test(t)) return false;
  return /^[\p{L}\s.'’-]+$/u.test(t);
}

const ALIAS_DOCUMENTACION: Array<{
  canonical: (typeof CABECERA_KEYS)[number];
  alias: string;
}> = [
  { canonical: "facturaOkFolio", alias: "Documentación folio" },
  { canonical: "facturaOkFirma", alias: "Documentación firma" },
  { canonical: "facturaOkNombre", alias: "Documentación nombre" },
  { canonical: "facturaOkHora", alias: "Documentación hora" },
];

/**
 * Hojas nuevas rotulan la caja «Documentación»; las viejas, «Factura (OK)».
 * Copia el alias al campo canónico y lo borra para que el resto del flujo no cambie.
 * «Documentó» es otra caja y no se toca.
 */
export function absorberAliasDocumentacion(campos: Record<string, string>): void {
  for (const { canonical, alias } of ALIAS_DOCUMENTACION) {
    const aliasValor = campos[alias]?.trim();
    const yaCanonico = campoValor(
      campos,
      canonical,
      CABECERA_LABELS[canonical],
    );
    if (!yaCanonico && aliasValor) {
      setCampoNombre(campos, canonical, aliasValor);
    }
    delete campos[alias];
  }
  const suelto = campos["Documentación"]?.trim();
  delete campos["Documentación"];
  if (
    suelto &&
    !campos.facturaOkNombre?.trim() &&
    !campos.facturaOkFirma?.trim()
  ) {
    setCampoNombre(campos, "facturaOkNombre", suelto);
  }
}