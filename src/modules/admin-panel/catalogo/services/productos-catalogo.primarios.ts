import { requireCodigoCuenta, runDomainQuery } from "@/lib/supabase/domain-query";
import { parseCatalogoMetadatos } from "../constants/catalogo-producto";
import { queryProductosCatalogo } from "./productos-catalogo.db-helpers";
import type {
  ListProductosPrimariosCatalogoParams,
  ProductoPrimarioOption,
} from "./productos-catalogo.types";

const PRIMARIO_PICKER_LIMIT = 500;

export async function listProductosPrimariosCatalogo(
  codigoCuentaOrParams: string | ListProductosPrimariosCatalogoParams,
): Promise<ProductoPrimarioOption[]> {
  const params =
    typeof codigoCuentaOrParams === "string"
      ? { codigoCuenta: codigoCuentaOrParams }
      : codigoCuentaOrParams;
  const cuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? PRIMARIO_PICKER_LIMIT;

  const rows = await queryProductosCatalogo((selectColumns) =>
    runDomainQuery<
      {
        id_producto: string;
        descripcion: string;
        sku: string;
        codigo_almacen: string | null;
        metadatos_catalogo?: unknown;
      }[]
    >((client) => {
      const primarioColumns = selectColumns.includes("metadatos_catalogo")
        ? "id_producto,descripcion,sku,codigo_almacen,metadatos_catalogo"
        : "id_producto,descripcion,sku,codigo_almacen";

      const query = client
        .from("producto")
        .select(primarioColumns)
        .eq("codigo_cuenta", cuenta)
        .eq("esta_activo", true)
        .eq("es_primario", true)
        .order("descripcion", { ascending: true })
        .limit(limit);

      return query as unknown as Promise<{
        data:
          | {
              id_producto: string;
              descripcion: string;
              sku: string;
              codigo_almacen: string | null;
              metadatos_catalogo?: unknown;
            }[]
          | null;
        error: { message: string } | null;
      }>;
    }),
  );

  const mapped = rows.map((row) => {
    const meta = parseCatalogoMetadatos(row.metadatos_catalogo);
    const titulo = meta.titulo?.trim() || row.descripcion.trim();
    const sku = row.sku.trim();
    const codigo = row.codigo_almacen?.trim() || sku;
    const categoria = meta.categoria?.trim() ?? "";
    const proveedor = meta.proveedor?.trim() ?? "";
    return {
      idProducto: row.id_producto,
      label: titulo ? `${titulo} (${sku})` : sku,
      titulo,
      codigo,
      sku,
      categoria,
      proveedor,
    };
  });

  return mapped;
}