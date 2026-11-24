import { runDomainMutation } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  CATALOGO_TIPO_PRIMARIO,
  CATALOGO_TIPO_SECUNDARIO,
  parseCatalogoMetadatos,
  parseTipoProductoCodigo,
  resolveTipoProductoLabel,
  type CatalogoProductoMetadatos,
} from "../constants/catalogo-producto";
import type {
  CatalogoProductoListRow,
  CreateCatalogoProductoInput,
  ProductoDbRow,
} from "./productos-catalogo.types";

export const PRODUCTO_LIST_COLUMNS =
  "id_producto,sku,descripcion,codigo_almacen,es_primario,es_secundario,unidad_visualizacion,unidad_medida,id_producto_primario,esta_activo";

export function buildProductoInsertPayload(
  input: CreateCatalogoProductoInput,
  codigoCuenta: string,
  sku: string,
  titulo: string,
  codigo: string,
): Record<string, unknown> {
  return {
    codigo_cuenta: codigoCuenta,
    sku,
    descripcion: titulo,
    codigo_almacen: codigo,
    unidad_medida: input.unidadMedida,
    unidad_visualizacion: input.unidadVisualizacion,
    es_primario: input.esPrimario,
    es_secundario: input.esSecundario,
    id_producto_primario: input.idProductoPrimario ?? null,
    regla_conversion_cantidad_primario:
      input.reglaConversionCantidadPrimario ?? null,
    regla_conversion_unidades_secundario:
      input.reglaConversionUnidadesSecundario ?? null,
    merma_pct: input.mermaPct ?? null,
    metadatos_catalogo: input.metadatos,
    esta_activo: true,
  };
}

function isMissingMetadatosCatalogoColumn(error: {
  message?: string;
} | null): boolean {
  return Boolean(
    error?.message?.includes("metadatos_catalogo") &&
      error.message.includes("does not exist"),
  );
}

export async function queryProductosCatalogo<T>(
  buildQuery: (selectColumns: string) => Promise<T[]>,
): Promise<T[]> {
  try {
    return await buildQuery(`${PRODUCTO_LIST_COLUMNS},metadatos_catalogo`);
  } catch (error: unknown) {
    if (
      error instanceof DomainServiceError &&
      isMissingMetadatosCatalogoColumn({ message: error.message })
    ) {
      return buildQuery(PRODUCTO_LIST_COLUMNS);
    }

    throw error;
  }
}

export async function insertProductoCatalogo(
  payload: Record<string, unknown>,
): Promise<ProductoDbRow> {
  const insertWithPayload = (body: Record<string, unknown>) =>
    runDomainMutation<ProductoDbRow>((client) => {
      const query = client
        .from("producto")
        .insert(body)
        .select(`${PRODUCTO_LIST_COLUMNS},metadatos_catalogo`)
        .single();

      return query as unknown as Promise<{
        data: ProductoDbRow | null;
        error: { message: string } | null;
      }>;
    });

  try {
    return await insertWithPayload(payload);
  } catch (error: unknown) {
    if (
      error instanceof DomainServiceError &&
      isMissingMetadatosCatalogoColumn({ message: error.message })
    ) {
      const { metadatos_catalogo: _meta, ...payloadWithoutMeta } = payload;
      return runDomainMutation<ProductoDbRow>((client) => {
        const query = client
          .from("producto")
          .insert(payloadWithoutMeta)
          .select(PRODUCTO_LIST_COLUMNS)
          .single();

        return query as unknown as Promise<{
          data: ProductoDbRow | null;
          error: { message: string } | null;
        }>;
      });
    }

    throw error;
  }
}

function resolveTipo(
  row: ProductoDbRow,
  meta: CatalogoProductoMetadatos,
): string {
  if (meta.tipo?.trim()) return meta.tipo.trim();
  if (row.es_secundario) return CATALOGO_TIPO_SECUNDARIO;
  if (row.es_primario) return CATALOGO_TIPO_PRIMARIO;
  return "—";
}

export function mapProductoRow(
  row: ProductoDbRow,
  index: number,
): CatalogoProductoListRow {
  const meta = parseCatalogoMetadatos(row.metadatos_catalogo);
  const titulo = meta.titulo?.trim() || row.descripcion.trim() || "—";
  const tipoProductoCodigo = parseTipoProductoCodigo(meta.tipo_producto);

  return {
    idProducto: row.id_producto,
    idNum: index + 1,
    codigo: row.codigo_almacen?.trim() || row.sku || "—",
    titulo,
    slug: meta.slug?.trim() || "—",
    descripcion: meta.descripcion?.trim() || row.descripcion || "—",
    proveedor: meta.proveedor?.trim() || "—",
    categoria: meta.categoria?.trim() || "—",
    tipo: resolveTipo(row, meta),
    tipoProducto: resolveTipoProductoLabel(meta.tipo_producto),
    tipoProductoCodigo,
    etiquetas: meta.etiquetas?.trim() || "—",
    publicado: meta.publicadoTienda ? "Sí" : "No",
    estado: meta.estado?.trim() || "—",
    sku: row.sku || "—",
    codigoBarras: meta.codigoBarras?.trim() || "—",
    nombreOpcion1: meta.nombreOpcion1?.trim() || "—",
    valorOpcion1: meta.valorOpcion1?.trim() || "—",
    vinculado:
      meta.incluidoPrimarioLabel?.trim() ||
      meta.vinculadoOpcion1?.trim() ||
      "—",
    unidad: row.unidad_medida?.trim() || "—",
    impuesto: meta.cobrarImpuesto ? "Sí" : "No",
    trackerInventario: meta.rastreadorInventario?.trim() || "—",
    stock: meta.cantidadInventario?.trim() || "0",
    estaActivo: row.esta_activo !== false,
  };
}