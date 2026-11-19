import type { CompradorListRow } from "@/modules/admin-panel";
import type { ProductoVentaOption } from "../../shared/types/sales.types";

/** Catálogo que el bootstrap deja listo para rankear cliente/producto (REQ-326). */
export type OvFormBootstrapCatalogo = {
  compradores: CompradorListRow[];
  productos: ProductoVentaOption[];
};

export function catalogoDesdeBootstrap(
  boot: OvFormBootstrapCatalogo | null | undefined,
  fallback: {
    compradores: readonly CompradorListRow[];
    productos: readonly ProductoVentaOption[];
  },
): OvFormBootstrapCatalogo {
  const compradores =
    boot?.compradores?.length && boot.compradores.length > 0
      ? boot.compradores
      : [...fallback.compradores];
  const productos =
    boot?.productos?.length && boot.productos.length > 0
      ? boot.productos
      : [...fallback.productos];
  return { compradores, productos };
}
