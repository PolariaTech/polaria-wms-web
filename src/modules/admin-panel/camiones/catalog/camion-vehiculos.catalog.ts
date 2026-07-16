/**
 * Catálogo editable de camiones de carga / flota de transporte.
 *
 * Actualizá marcas y modelos aquí (no hace falta tocar la UI).
 * Criterio: unidades usadas para mercadería (ligero → pesado, LATAM + flota común).
 */

export type CamionSegmentoCatalog = "ligero" | "mediano" | "pesado";

export interface CamionMarcaCatalogItem {
  id: string;
  nombre: string;
  /** Región / origen comercial habitual */
  origen: string;
  segmento: CamionSegmentoCatalog;
}

export interface CamionModeloCatalogItem {
  id: string;
  marcaId: string;
  nombre: string;
  segmento: CamionSegmentoCatalog;
}

/** Marcas frecuentes en transporte de mercancía (actualizar según flota real). */
export const CAMION_MARCAS_CATALOG: readonly CamionMarcaCatalogItem[] = [
  { id: "isuzu", nombre: "Isuzu", origen: "Japón", segmento: "ligero" },
  { id: "hino", nombre: "Hino", origen: "Japón", segmento: "ligero" },
  { id: "mitsubishi-fuso", nombre: "Mitsubishi Fuso", origen: "Japón", segmento: "ligero" },
  { id: "mercedes-benz", nombre: "Mercedes-Benz", origen: "Alemania", segmento: "mediano" },
  { id: "volkswagen", nombre: "Volkswagen", origen: "Brasil / Alemania", segmento: "mediano" },
  { id: "iveco", nombre: "Iveco", origen: "Italia", segmento: "mediano" },
  { id: "man", nombre: "MAN", origen: "Alemania", segmento: "pesado" },
  { id: "volvo", nombre: "Volvo", origen: "Suecia", segmento: "pesado" },
  { id: "scania", nombre: "Scania", origen: "Suecia", segmento: "pesado" },
  { id: "freightliner", nombre: "Freightliner", origen: "EE.UU.", segmento: "pesado" },
  { id: "kenworth", nombre: "Kenworth", origen: "EE.UU.", segmento: "pesado" },
  { id: "international", nombre: "International", origen: "EE.UU.", segmento: "pesado" },
  { id: "peterbilt", nombre: "Peterbilt", origen: "EE.UU.", segmento: "pesado" },
  { id: "mack", nombre: "Mack", origen: "EE.UU.", segmento: "pesado" },
  { id: "daf", nombre: "DAF", origen: "Países Bajos", segmento: "pesado" },
  { id: "ford", nombre: "Ford", origen: "EE.UU.", segmento: "mediano" },
  { id: "chevrolet", nombre: "Chevrolet", origen: "EE.UU. / Brasil", segmento: "mediano" },
  { id: "jac", nombre: "JAC", origen: "China", segmento: "ligero" },
  { id: "foton", nombre: "Foton", origen: "China", segmento: "mediano" },
  { id: "shacman", nombre: "Shacman", origen: "China", segmento: "pesado" },
] as const;

/**
 * Modelos por marca. Agregá filas nuevas al final del grupo correspondiente.
 * `marcaId` debe coincidir con `CAMION_MARCAS_CATALOG[].id`.
 */
export const CAMION_MODELOS_CATALOG: readonly CamionModeloCatalogItem[] = [
  // Isuzu
  { id: "isuzu-npr", marcaId: "isuzu", nombre: "NPR", segmento: "ligero" },
  { id: "isuzu-nqr", marcaId: "isuzu", nombre: "NQR", segmento: "ligero" },
  { id: "isuzu-nrr", marcaId: "isuzu", nombre: "NRR", segmento: "ligero" },
  { id: "isuzu-ftr", marcaId: "isuzu", nombre: "FTR", segmento: "mediano" },
  { id: "isuzu-fvr", marcaId: "isuzu", nombre: "FVR", segmento: "mediano" },
  // Hino
  { id: "hino-300", marcaId: "hino", nombre: "Serie 300", segmento: "ligero" },
  { id: "hino-500", marcaId: "hino", nombre: "Serie 500", segmento: "mediano" },
  { id: "hino-700", marcaId: "hino", nombre: "Serie 700", segmento: "pesado" },
  // Mitsubishi Fuso
  { id: "fuso-canter", marcaId: "mitsubishi-fuso", nombre: "Canter", segmento: "ligero" },
  { id: "fuso-fighter", marcaId: "mitsubishi-fuso", nombre: "Fighter", segmento: "mediano" },
  { id: "fuso-super-great", marcaId: "mitsubishi-fuso", nombre: "Super Great", segmento: "pesado" },
  // Mercedes-Benz
  { id: "mb-accelo", marcaId: "mercedes-benz", nombre: "Accelo", segmento: "ligero" },
  { id: "mb-atego", marcaId: "mercedes-benz", nombre: "Atego", segmento: "mediano" },
  { id: "mb-axor", marcaId: "mercedes-benz", nombre: "Axor", segmento: "pesado" },
  { id: "mb-actros", marcaId: "mercedes-benz", nombre: "Actros", segmento: "pesado" },
  // Volkswagen
  { id: "vw-delivery", marcaId: "volkswagen", nombre: "Delivery", segmento: "ligero" },
  { id: "vw-worker", marcaId: "volkswagen", nombre: "Worker", segmento: "mediano" },
  { id: "vw-constellation", marcaId: "volkswagen", nombre: "Constellation", segmento: "pesado" },
  // Iveco
  { id: "iveco-daily", marcaId: "iveco", nombre: "Daily", segmento: "ligero" },
  { id: "iveco-eurocargo", marcaId: "iveco", nombre: "Eurocargo", segmento: "mediano" },
  { id: "iveco-stralis", marcaId: "iveco", nombre: "Stralis", segmento: "pesado" },
  { id: "iveco-s-way", marcaId: "iveco", nombre: "S-Way", segmento: "pesado" },
  // MAN
  { id: "man-tgl", marcaId: "man", nombre: "TGL", segmento: "ligero" },
  { id: "man-tgm", marcaId: "man", nombre: "TGM", segmento: "mediano" },
  { id: "man-tgx", marcaId: "man", nombre: "TGX", segmento: "pesado" },
  // Volvo
  { id: "volvo-fl", marcaId: "volvo", nombre: "FL", segmento: "ligero" },
  { id: "volvo-fe", marcaId: "volvo", nombre: "FE", segmento: "mediano" },
  { id: "volvo-fm", marcaId: "volvo", nombre: "FM", segmento: "pesado" },
  { id: "volvo-fh", marcaId: "volvo", nombre: "FH", segmento: "pesado" },
  { id: "volvo-vnl", marcaId: "volvo", nombre: "VNL", segmento: "pesado" },
  { id: "volvo-vnr", marcaId: "volvo", nombre: "VNR", segmento: "pesado" },
  // Scania
  { id: "scania-p", marcaId: "scania", nombre: "Serie P", segmento: "mediano" },
  { id: "scania-g", marcaId: "scania", nombre: "Serie G", segmento: "pesado" },
  { id: "scania-r", marcaId: "scania", nombre: "Serie R", segmento: "pesado" },
  { id: "scania-s", marcaId: "scania", nombre: "Serie S", segmento: "pesado" },
  // Freightliner
  { id: "fl-m2", marcaId: "freightliner", nombre: "M2 106", segmento: "mediano" },
  { id: "fl-m2-112", marcaId: "freightliner", nombre: "M2 112", segmento: "mediano" },
  { id: "fl-cascadia", marcaId: "freightliner", nombre: "Cascadia", segmento: "pesado" },
  // Kenworth
  { id: "kw-t270", marcaId: "kenworth", nombre: "T270", segmento: "mediano" },
  { id: "kw-t680", marcaId: "kenworth", nombre: "T680", segmento: "pesado" },
  { id: "kw-t800", marcaId: "kenworth", nombre: "T800", segmento: "pesado" },
  { id: "kw-w900", marcaId: "kenworth", nombre: "W900", segmento: "pesado" },
  // International
  { id: "int-mv", marcaId: "international", nombre: "MV", segmento: "mediano" },
  { id: "int-durastar", marcaId: "international", nombre: "DuraStar", segmento: "mediano" },
  { id: "int-lt", marcaId: "international", nombre: "LT", segmento: "pesado" },
  { id: "int-hx", marcaId: "international", nombre: "HX", segmento: "pesado" },
  // Peterbilt
  { id: "pb-567", marcaId: "peterbilt", nombre: "567", segmento: "pesado" },
  { id: "pb-579", marcaId: "peterbilt", nombre: "579", segmento: "pesado" },
  { id: "pb-389", marcaId: "peterbilt", nombre: "389", segmento: "pesado" },
  // Mack
  { id: "mack-anthem", marcaId: "mack", nombre: "Anthem", segmento: "pesado" },
  { id: "mack-granite", marcaId: "mack", nombre: "Granite", segmento: "pesado" },
  // DAF
  { id: "daf-lf", marcaId: "daf", nombre: "LF", segmento: "ligero" },
  { id: "daf-cf", marcaId: "daf", nombre: "CF", segmento: "mediano" },
  { id: "daf-xf", marcaId: "daf", nombre: "XF", segmento: "pesado" },
  // Ford
  { id: "ford-f350", marcaId: "ford", nombre: "F-350", segmento: "ligero" },
  { id: "ford-f450", marcaId: "ford", nombre: "F-450", segmento: "ligero" },
  { id: "ford-f650", marcaId: "ford", nombre: "F-650", segmento: "mediano" },
  { id: "ford-cargo", marcaId: "ford", nombre: "Cargo", segmento: "mediano" },
  // Chevrolet
  { id: "chevy-nqr", marcaId: "chevrolet", nombre: "NPR / NQR (Isuzu OEM)", segmento: "ligero" },
  { id: "chevy-silverado", marcaId: "chevrolet", nombre: "Silverado 3500 HD", segmento: "ligero" },
  // JAC / Foton / Shacman
  { id: "jac-nseries", marcaId: "jac", nombre: "Serie N", segmento: "ligero" },
  { id: "foton-aujland", marcaId: "foton", nombre: "Auman", segmento: "mediano" },
  { id: "shacman-x3000", marcaId: "shacman", nombre: "X3000", segmento: "pesado" },
] as const;

export const CAMION_SEGMENTO_LABEL: Record<CamionSegmentoCatalog, string> = {
  ligero: "Ligero",
  mediano: "Mediano",
  pesado: "Pesado",
};

export function getCamionMarcaById(
  marcaId: string,
): CamionMarcaCatalogItem | undefined {
  return CAMION_MARCAS_CATALOG.find((marca) => marca.id === marcaId);
}

export function listModelosByMarcaId(
  marcaId: string,
): CamionModeloCatalogItem[] {
  return CAMION_MODELOS_CATALOG.filter((modelo) => modelo.marcaId === marcaId);
}
