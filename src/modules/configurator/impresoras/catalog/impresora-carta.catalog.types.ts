/**
 * Catálogo de marcas y modelos de impresoras de papel carta (Letter 8.5×11),
 * típicas en oficinas de Colombia, México y Estados Unidos.
 */

export interface ImpresoraMarcaCatalogItem {
  id: string;
  nombre: string;
  origen: string;
}

export interface ImpresoraModeloCatalogItem {
  id: string;
  marcaId: string;
  nombre: string;
  tipo: "laser" | "inkjet" | "mfp";
}

export const IMPRESORA_TIPO_LABEL: Record<
  ImpresoraModeloCatalogItem["tipo"],
  string
> = {
  laser: "Láser",
  inkjet: "Inyección",
  mfp: "Multifunción",
};
