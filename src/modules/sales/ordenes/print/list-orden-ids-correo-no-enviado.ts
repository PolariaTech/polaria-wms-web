import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import {
  TIPO_CORREO_NO_ENVIADO,
  TIPOS_IMPRESION_OK,
  idsConCorreoNoEnviado,
  type ImpresionMarca,
} from "./print-correo-fallo";

const TIPOS = [TIPO_CORREO_NO_ENVIADO, ...TIPOS_IMPRESION_OK];

type MarcaRow = {
  entidad_id: string | null;
  created_at: string;
  payload: { tipo?: unknown } | null;
};

function chunks<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

/** OV cuyo último intento de impresión dejó el correo sin enviar. */
export async function listOrdenIdsCorreoNoEnviado(input: {
  codigoCuenta: string;
  idOrdenes: string[];
}): Promise<Set<string>> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const ids = [
    ...new Set(input.idOrdenes.map((id) => id.trim()).filter(Boolean)),
  ];
  if (ids.length === 0) return new Set();

  const marcas: ImpresionMarca[] = [];
  try {
    for (const grupo of chunks(ids, 80)) {
      const rows = await runDomainQuery<MarcaRow[]>((client) => {
        const query = client
          .from("auditoria_operacion")
          .select("entidad_id,created_at,payload")
          .eq("codigo_cuenta", codigoCuenta)
          .eq("entidad", "orden_venta")
          .in("entidad_id", grupo)
          .or(TIPOS.map((tipo) => `payload->>tipo.eq.${tipo}`).join(","))
          .order("created_at", { ascending: false })
          .limit(500);

        return query as unknown as Promise<{
          data: MarcaRow[] | null;
          error: { message: string } | null;
        }>;
      });

      for (const row of rows) {
        const idOrdenVenta = row.entidad_id?.trim() ?? "";
        const tipo =
          typeof row.payload?.tipo === "string" ? row.payload.tipo.trim() : "";
        if (!idOrdenVenta || !tipo) continue;
        marcas.push({
          idOrdenVenta,
          tipo,
          createdAt: row.created_at,
        });
      }
    }
  } catch (error) {
    console.error(
      "[ov] no se pudieron leer las órdenes con correo sin enviar:",
      error,
    );
    return new Set();
  }

  return idsConCorreoNoEnviado(marcas);
}
