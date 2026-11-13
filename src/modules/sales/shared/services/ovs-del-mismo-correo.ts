import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { parseOrigenArchivos } from "../../ordenes/utils/origen/origen-adjuntos";

/** Una OV que salió del mismo correo (REQ-313). */
export interface OvDelMismoCorreo {
  idOrdenVenta: string;
  codigo: string;
  ordenCompra: string | null;
}

interface FilaOv {
  id_orden_venta: string;
  codigo: string;
  orden_compra_hotel: string | null;
  estado: string | null;
  origen_archivos: string | null;
}

/** El uuid del envío va en la ruta (`cuenta/uuid-nombre`): es lo que une a las OV del mismo correo. */
const UUID_EN_RUTA = /[0-9a-f]{8}-[0-9a-f]{4}-/i;

/**
 * REQ-313: las OV de la cuenta que guardan los mismos adjuntos que esta (un correo con varias OC se
 * parte en varias OV). Se busca por la ruta de un adjunto, que lleva un uuid único por envío; si el
 * origen es legado (solo nombres) no hay con qué buscar y no se consulta. Incluye a la propia OV.
 */
export async function buscarOvsDelMismoCorreo(input: {
  codigoCuenta: string;
  origenArchivos: string | null | undefined;
}): Promise<OvDelMismoCorreo[]> {
  const cuenta = requireCodigoCuenta(input.codigoCuenta);
  const path = parseOrigenArchivos(input.origenArchivos)
    .map((adjunto) => adjunto.path?.trim() ?? "")
    .find((ruta) => UUID_EN_RUTA.test(ruta));
  if (!path) return [];

  const escapado = path.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
  const filas = await runDomainQuery<FilaOv[]>((client) => {
    const query = client
      .from("orden_venta")
      .select("id_orden_venta, codigo, orden_compra_hotel, estado, origen_archivos")
      .eq("codigo_cuenta", cuenta)
      .like("origen_archivos", `%${escapado}%`)
      .order("codigo")
      .limit(20);
    return query as unknown as Promise<{
      data: FilaOv[] | null;
      error: { message: string } | null;
    }>;
  });

  return filas
    .filter((fila) =>
      parseOrigenArchivos(fila.origen_archivos).some((adjunto) => adjunto.path?.trim() === path),
    )
    .map((fila) => ({
      idOrdenVenta: fila.id_orden_venta,
      codigo: fila.codigo,
      ordenCompra: fila.orden_compra_hotel,
    }));
}
