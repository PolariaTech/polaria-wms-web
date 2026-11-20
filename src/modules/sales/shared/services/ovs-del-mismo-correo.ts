import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { claveEnvioDesdeOrigenArchivos } from "../../ordenes/utils/match/annotate-correo-partido-ov";
import { parseOrigenArchivos } from "../../ordenes/utils/origen/origen-adjuntos";

/** Una OV que salió del mismo correo (REQ-313 / REQ-347). */
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

function mapFilas(filas: FilaOv[], pathExacto: string | null): OvDelMismoCorreo[] {
  return filas
    .filter((fila) => (fila.estado ?? "").toLowerCase() !== "cancelada")
    .filter((fila) => {
      if (!pathExacto) return true;
      return parseOrigenArchivos(fila.origen_archivos).some(
        (adjunto) => adjunto.path?.trim() === pathExacto,
      );
    })
    .map((fila) => ({
      idOrdenVenta: fila.id_orden_venta,
      codigo: fila.codigo,
      ordenCompra: fila.orden_compra_hotel,
    }));
}

async function consultarHermanas(input: {
  cuenta: string;
  origenExacto?: string;
  likePath?: string;
}): Promise<FilaOv[]> {
  return runDomainQuery<FilaOv[]>((client) => {
    let query = client
      .from("orden_venta")
      .select("id_orden_venta, codigo, orden_compra_hotel, estado, origen_archivos")
      .eq("codigo_cuenta", input.cuenta);

    if (input.origenExacto) {
      query = query.eq("origen_archivos", input.origenExacto);
    } else if (input.likePath) {
      const escapado = input.likePath.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
      query = query.like("origen_archivos", `%${escapado}%`);
    }

    const finalQuery = query.order("codigo").limit(20);
    return finalQuery as unknown as Promise<{
      data: FilaOv[] | null;
      error: { message: string } | null;
    }>;
  });
}

/**
 * REQ-313 / REQ-347: OV de la cuenta del mismo envío (adjunto con uuid en path).
 * 1) Igualdad exacta de `origen_archivos` (hermanas con el mismo JSON).
 * 2) Si hace falta, LIKE por el path con uuid (cada OV puede guardar solo su PDF).
 * Si el origen es legado (sin path/uuid) no hay con qué buscar.
 */
export async function buscarOvsDelMismoCorreo(input: {
  codigoCuenta: string;
  origenArchivos: string | null | undefined;
}): Promise<OvDelMismoCorreo[]> {
  const cuenta = requireCodigoCuenta(input.codigoCuenta);
  const origenExacto = input.origenArchivos?.trim() || "";
  const path = claveEnvioDesdeOrigenArchivos(input.origenArchivos);

  if (origenExacto) {
    const exactas = mapFilas(
      await consultarHermanas({ cuenta, origenExacto }),
      null,
    );
    if (exactas.length >= 2) return exactas;
  }

  if (!path) return [];

  return mapFilas(await consultarHermanas({ cuenta, likePath: path }), path);
}
