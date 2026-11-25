import { IMPRESORA_MARCAS_CATALOG } from "./impresora-carta.catalog.marcas";
import { IMPRESORA_MODELOS_CATALOG } from "./impresora-carta.catalog.modelos";
import type {
  ImpresoraMarcaCatalogItem,
  ImpresoraModeloCatalogItem,
} from "./impresora-carta.catalog.types";

export function getImpresoraMarcaById(
  marcaId: string,
): ImpresoraMarcaCatalogItem | undefined {
  return IMPRESORA_MARCAS_CATALOG.find((marca) => marca.id === marcaId);
}

export function listImpresoraModelosByMarca(
  marcaId: string,
): ImpresoraModeloCatalogItem[] {
  return IMPRESORA_MODELOS_CATALOG.filter((modelo) => modelo.marcaId === marcaId);
}

export function findImpresoraMarcaByNombre(
  nombre: string | null | undefined,
): ImpresoraMarcaCatalogItem | undefined {
  const needle = nombre?.trim().toLowerCase();
  if (!needle) return undefined;
  return IMPRESORA_MARCAS_CATALOG.find(
    (marca) => marca.nombre.toLowerCase() === needle,
  );
}

export function findImpresoraModeloByNombre(
  marcaId: string,
  nombre: string | null | undefined,
): ImpresoraModeloCatalogItem | undefined {
  const needle = nombre?.trim().toLowerCase();
  if (!needle || !marcaId) return undefined;
  return listImpresoraModelosByMarca(marcaId).find(
    (modelo) => modelo.nombre.toLowerCase() === needle,
  );
}
