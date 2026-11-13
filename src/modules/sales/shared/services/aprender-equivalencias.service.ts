import {
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { normalizeForMatch } from "../../ordenes/utils/match/normalize-for-match";
import type { AprendizajeEquivalencia } from "../../ordenes/utils/match/aprender-equivalencias";

export interface ResumenAprendizajeEquivalencias {
  creadas: number;
  actualizadas: number;
  fallidas: number;
}

interface FilaAliasFrase {
  id_alias: string;
  id_producto: string;
  alias: string | null;
  precio: string | number | null;
}

export async function aprenderEquivalencias(params: {
  codigoCuenta: string;
  idComprador: string | null | undefined;
  aprendizajes: readonly AprendizajeEquivalencia[];
}): Promise<ResumenAprendizajeEquivalencias> {
  const resumen: ResumenAprendizajeEquivalencias = {
    creadas: 0,
    actualizadas: 0,
    fallidas: 0,
  };
  const idComprador = params.idComprador?.trim() ?? "";
  if (!idComprador || params.aprendizajes.length === 0) return resumen;

  try {
    const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
    for (const aprendizaje of params.aprendizajes) {
      try {
        const aplicado = await aplicarAprendizaje({
          codigoCuenta,
          idComprador,
          aprendizaje,
        });
        resumen.creadas += aplicado.creadas;
        resumen.actualizadas += aplicado.actualizadas;
      } catch {
        resumen.fallidas += 1;
      }
    }
    return resumen;
  } catch {
    return {
      creadas: 0,
      actualizadas: 0,
      fallidas: params.aprendizajes.length,
    };
  }
}

async function aplicarAprendizaje(params: {
  codigoCuenta: string;
  idComprador: string;
  aprendizaje: AprendizajeEquivalencia;
}): Promise<{ creadas: number; actualizadas: number }> {
  const fila = await buscarFilaPorFrase(params);
  const frase = params.aprendizaje.frase.trim().slice(0, 255);
  if (!fila) {
    await insertarFrase({ ...params, frase, precio: null });
    return { creadas: 1, actualizadas: 0 };
  }
  if (fila.id_producto === params.aprendizaje.idProducto) {
    return { creadas: 0, actualizadas: 0 };
  }
  if (fila.precio == null || fila.precio === "") {
    await actualizarFila(params.codigoCuenta, fila.id_alias, {
      id_producto: params.aprendizaje.idProducto,
      alias: frase,
    });
    return { creadas: 0, actualizadas: 1 };
  }
  await actualizarFila(params.codigoCuenta, fila.id_alias, { alias: "" });
  await insertarFrase({ ...params, frase, precio: null });
  return { creadas: 1, actualizadas: 1 };
}

async function buscarFilaPorFrase(params: {
  codigoCuenta: string;
  idComprador: string;
  aprendizaje: AprendizajeEquivalencia;
}): Promise<FilaAliasFrase | null> {
  const filas = await runDomainQuery<FilaAliasFrase[]>((client) => {
    const query = client
      .from("comprador_producto_alias")
      .select("id_alias, id_producto, alias, precio")
      .eq("codigo_cuenta", params.codigoCuenta)
      .eq("id_comprador", params.idComprador)
      .eq("alias_normalizado", normalizeForMatch(params.aprendizaje.frase));
    return query as unknown as Promise<{
      data: FilaAliasFrase[] | null;
      error: { message: string } | null;
    }>;
  });
  return filas[0] ?? null;
}

async function actualizarFila(
  codigoCuenta: string,
  idAlias: string,
  payload: { alias?: string; id_producto?: string },
): Promise<void> {
  await runDomainMutation((client) => {
    const query = client
      .from("comprador_producto_alias")
      .update(payload)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_alias", idAlias);
    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });
}

async function insertarFrase(params: {
  codigoCuenta: string;
  idComprador: string;
  aprendizaje: AprendizajeEquivalencia;
  frase: string;
  precio: null;
}): Promise<void> {
  await runDomainMutation((client) => {
    const query = client.from("comprador_producto_alias").insert({
      codigo_cuenta: params.codigoCuenta,
      id_comprador: params.idComprador,
      id_producto: params.aprendizaje.idProducto,
      alias: params.frase,
      precio: params.precio,
    });
    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });
}
