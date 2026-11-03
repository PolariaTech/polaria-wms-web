import type { OrdenVentaOperadorRow } from "@/modules/sales/shared/types/sales.types";
import { resolveCompradorParaListado } from "../../utils/pedido/resolve-cabecera-guardada";

/** REQ-169: celda Cliente del listado (catálogo o tentativo Mateo). */
export function renderClienteListadoCell(row: OrdenVentaOperadorRow) {
  const cliente = resolveCompradorParaListado({
    compradorCatalogo: row.comprador,
    origenCorreo: row.origenCorreo,
  });
  return (
    <span className="block max-w-[12.5rem] truncate" title={cliente}>
      {cliente}
    </span>
  );
}
