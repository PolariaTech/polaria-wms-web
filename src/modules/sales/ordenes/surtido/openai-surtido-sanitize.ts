import { CABECERA_KEYS } from "./openai-surtido-schema";
import {
  absorberAliasDocumentacion,
  campoValor,
  clearCampo,
  normalizeProductoKey,
  pareceFolioManuscrito,
  pareceNombrePersona,
  setCampoNombre,
} from "./openai-surtido-campos";

/** Factura asociada ≠ firmas: no debe llevar nombres de Alistó/Revisó/Despachó/etc. */
export function sanitizeFacturaAsociada(
  campos: Record<string, string>,
): void {
  absorberAliasDocumentacion(campos);
  const factura = campoValor(
    campos,
    "facturaAsociada",
    "Folio factura asociada",
    "Factura asociada",
  );
  if (!factura) return;

  const firmas = [
    campoValor(campos, "alistoNombre", "Alistó nombre", "Alistó"),
    campoValor(campos, "revisoNombre", "Revisó nombre", "Revisó"),
    campoValor(
      campos,
      "facturaOkNombre",
      "Factura (OK) nombre",
      "Documentación nombre",
    ),
    campoValor(
      campos,
      "facturaOkFirma",
      "Factura (OK) firma",
      "Documentación firma",
    ),
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
  const pareceNombreSinFolio =
    !/\d/.test(factura) && /^[\p{L}\s.'’-]+$/u.test(factura.trim());

  if (coincideFirma || pareceNombreSinFolio) {
    clearCampo(
      campos,
      "facturaAsociada",
      "Folio factura asociada",
      "Factura asociada",
      "factura",
    );
  }
}

/**
 * Corrige cruces Folio ↔ Firma dentro de «Factura (OK)».
 * Folio = número/código; Firma = nombre de persona.
 */
export function sanitizeFacturaOkFolioFirma(
  campos: Record<string, string>,
): void {
  absorberAliasDocumentacion(campos);
  let folio = campoValor(campos, "facturaOkFolio", "Factura (OK) folio");
  let firma = campoValor(
    campos,
    "facturaOkFirma",
    "Factura (OK) firma",
    "facturaOkNombre",
    "Factura (OK) nombre",
  );

  if (
    folio &&
    firma &&
    pareceNombrePersona(folio) &&
    !pareceFolioManuscrito(folio) &&
    pareceFolioManuscrito(firma)
  ) {
    const swappedFolio = firma.trim();
    const swappedFirma = folio.trim();
    setCampoNombre(campos, "facturaOkFolio", swappedFolio);
    setCampoNombre(campos, "facturaOkFirma", swappedFirma);
    setCampoNombre(campos, "facturaOkNombre", swappedFirma);
    folio = swappedFolio;
    firma = swappedFirma;
  }

  if (
    folio &&
    !firma &&
    pareceNombrePersona(folio) &&
    !pareceFolioManuscrito(folio)
  ) {
    const nombre = folio.trim();
    setCampoNombre(campos, "facturaOkFirma", nombre);
    setCampoNombre(campos, "facturaOkNombre", nombre);
    clearCampo(campos, "facturaOkFolio", "Factura (OK) folio");
  }

  if (firma && !folio && pareceFolioManuscrito(firma)) {
    setCampoNombre(campos, "facturaOkFolio", firma.trim());
    clearCampo(
      campos,
      "facturaOkFirma",
      "Factura (OK) firma",
      "facturaOkNombre",
      "Factura (OK) nombre",
    );
    return;
  }

  const folioActual = campoValor(campos, "facturaOkFolio", "Factura (OK) folio");
  if (
    folioActual &&
    pareceNombrePersona(folioActual) &&
    !pareceFolioManuscrito(folioActual)
  ) {
    clearCampo(campos, "facturaOkFolio", "Factura (OK) folio");
  }

  const firmaActual = campoValor(
    campos,
    "facturaOkFirma",
    "Factura (OK) firma",
    "facturaOkNombre",
    "Factura (OK) nombre",
  );
  if (firmaActual && /^\d{1,2}[:.]\d{2}/.test(firmaActual.trim())) {
    clearCampo(
      campos,
      "facturaOkFirma",
      "Factura (OK) firma",
      "facturaOkNombre",
      "Factura (OK) nombre",
    );
  }
}

/** Si Revisó (u otro) solo trajo el apellido y otro campo tiene el nombre completo, completa. */
export function expandNombresParcialesFirmas(
  campos: Record<string, string>,
): void {
  const candidatos = [
    campoValor(campos, "alistoNombre", "Alistó nombre", "Alistó"),
    campoValor(campos, "revisoNombre", "Revisó nombre", "Revisó"),
    campoValor(campos, "retornoNombre", "Retorno nombre", "Retorno"),
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