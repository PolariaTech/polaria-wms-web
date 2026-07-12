import { useAuthStore } from "@/stores/auth.store";
import type { ProductoVentaOption } from "../types/sales.types";
import { listProductosVentaCatalogo } from "./sales.service";

export async function fetchProductosVentaCatalogo(
  codigoCuenta: string,
): Promise<ProductoVentaOption[]> {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    try {
      const response = await fetch(
        `/api/ventas/productos-catalogo?codigoCuenta=${encodeURIComponent(codigoCuenta)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        },
      );

      if (response.ok) {
        return (await response.json()) as ProductoVentaOption[];
      }
    } catch {
      // fallback al cliente Supabase
    }
  }

  return listProductosVentaCatalogo({ codigoCuenta });
}
