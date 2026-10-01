import type { OrdenVentaLineaRow } from "../../shared/types/sales.types";
import { resolveOrdenVentaLineaTitulo } from "./orden-venta-display";
import type { OrdenTrabajoHija } from "./origen-correo-ordenes-trabajo";

/** Filtra líneas de la OV que pertenecen a una orden de trabajo hija. */
export function filterLineasByOrdenTrabajoHija<
  T extends Pick<OrdenVentaLineaRow, "producto"> & {
    producto?: OrdenVentaLineaRow["producto"];
  },
>(allLineItems: readonly T[], hija: OrdenTrabajoHija | null | undefined): T[] {
  if (!hija) return [...allLineItems];

  const keys = new Set(
    hija.renglones.flatMap((row) => {
      const out: string[] = [];
      const prod = (row.Producto ?? "").trim().toLowerCase();
      const cod = (row["Codigo producto"] ?? "").trim().toLowerCase();
      if (prod) out.push(prod);
      if (cod) out.push(cod);
      return out;
    }),
  );
  if (keys.size === 0) return [...allLineItems];

  const matched = allLineItems.filter((linea) => {
    const titulo = resolveOrdenVentaLineaTitulo(linea).toLowerCase();
    const sku =
      linea.producto && !Array.isArray(linea.producto)
        ? (linea.producto.sku ?? "").trim().toLowerCase()
        : "";
    return (
      keys.has(titulo) ||
      (Boolean(sku) && keys.has(sku)) ||
      [...keys].some((k) => titulo.includes(k) || k.includes(titulo))
    );
  });

  return matched.length > 0 ? matched : [...allLineItems];
}
