import { useAuthStore } from "@/stores/auth.store";
import type { ProductoVentaOption } from "../types/sales.types";

export async function fetchProductosVentaCatalogo(
  codigoCuenta: string,
): Promise<ProductoVentaOption[]> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error("Sesión requerida para el catálogo de venta.");
  }

  const response = await fetch(
    `/api/ventas/productos-catalogo?codigoCuenta=${encodeURIComponent(codigoCuenta)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Catálogo de venta falló (${response.status}).`);
  }

  const productos = (await response.json()) as unknown;
  if (!Array.isArray(productos)) {
    throw new Error("Catálogo de venta respondió un formato inválido.");
  }
  return productos as ProductoVentaOption[];
}
