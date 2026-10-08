import type { MatchProductoLinea, MatchProductoRef } from "../../shared/types/sales.types";

export function buildMatchProductoLinea(params: {
  textoCliente?: string | null;
  sugeridoMateo?: {
    idProducto?: string | null;
    nombre?: string | null;
    codigo?: string | null;
  } | null;
  elegidoUsuario: {
    idProducto: string;
    nombre?: string | null;
    codigo?: string | null;
  };
}): MatchProductoLinea | null {
  const idElegido = params.elegidoUsuario.idProducto.trim();
  if (!idElegido) return null;

  const textoCliente = (params.textoCliente ?? "").trim();
  const sug = params.sugeridoMateo;
  let sugeridoMateo: MatchProductoRef | null = null;
  if (sug) {
    const nombre = (sug.nombre ?? "").trim();
    const codigo = (sug.codigo ?? "").trim();
    const idProducto = sug.idProducto?.trim() || null;
    if (nombre || codigo || idProducto) {
      sugeridoMateo = {
        idProducto,
        nombre,
        codigo,
      };
    }
  }

  return {
    textoCliente,
    sugeridoMateo,
    elegidoUsuario: {
      idProducto: idElegido,
      nombre: (params.elegidoUsuario.nombre ?? "").trim(),
      codigo: (params.elegidoUsuario.codigo ?? "").trim(),
    },
  };
}
