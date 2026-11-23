import { IMPRESORA_MODELOS_CATALOG_A } from "./impresora-carta.catalog.modelos.a";
import { IMPRESORA_MODELOS_CATALOG_B } from "./impresora-carta.catalog.modelos.b";

export const IMPRESORA_MODELOS_CATALOG = [
  ...IMPRESORA_MODELOS_CATALOG_A,
  ...IMPRESORA_MODELOS_CATALOG_B,
] as const;
