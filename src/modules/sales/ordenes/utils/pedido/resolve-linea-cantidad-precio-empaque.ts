import { aplicarEmpaqueInicialLinea } from "./empaque-lineas";
import {
  formatEspecificacionEnvase,
  resolveCantidadPrecioDesdeEnvase,
} from "./resolve-cantidad-envase";

/**
 * Cantidad/precio/empaque de una línea: si el texto trae "N envase de X unidad"
 * y el catálogo vende en esa familia, convierte; si no, empaque cajas/kg.
 */
export function resolveLineaCantidadPrecioEmpaque(params: {
  textoOriginal: string;
  unidadMedidaCatalogo: string;
  cantidad: number | null | undefined;
  cajas: number | null | undefined;
  presentacion: string;
  precioDoc: number | null;
  precioCatalogo: number;
  /** A veces el envase viene en la especificación IA, no en el nombre. */
  especificacionIa?: string | null;
}): {
  cantidadInput: string;
  cajasInput: string;
  presentacion: string;
  precioUnitario: number;
  precioManual: boolean;
  packHint: string;
  autoPackFields: Array<"cajasInput" | "presentacion" | "cantidadInput">;
  /** REQ-124: frase de envase para Especificación, o "". */
  especificacionEnvase: string;
} {
  const textoParaEnvase = [params.textoOriginal, params.especificacionIa]
    .map((parte) => (parte ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const converted = resolveCantidadPrecioDesdeEnvase({
    textoOriginal: textoParaEnvase || params.textoOriginal,
    unidadMedidaCatalogo: params.unidadMedidaCatalogo,
    cantidadRaw: params.cantidad,
    precioDoc: params.precioDoc,
  });

  if (converted) {
    return {
      cantidadInput: String(converted.cantidad),
      cajasInput: "",
      presentacion: "",
      precioUnitario:
        converted.precioUnitario ??
        params.precioDoc ??
        params.precioCatalogo,
      precioManual:
        converted.precioUnitario != null || params.precioDoc != null,
      packHint: `Envase → ${converted.cantidad} ${params.unidadMedidaCatalogo || "u"} (${converted.frase})`,
      autoPackFields: ["cantidadInput"],
      especificacionEnvase: formatEspecificacionEnvase(converted),
    };
  }

  const baseLinea = {
    cajasInput:
      params.cajas != null && Number.isFinite(params.cajas)
        ? String(params.cajas)
        : "",
    presentacion: params.presentacion,
    cantidadInput:
      params.cantidad != null && Number.isFinite(params.cantidad)
        ? String(params.cantidad)
        : "",
  };
  const empaque = aplicarEmpaqueInicialLinea(baseLinea);
  return {
    cantidadInput: empaque.cantidadInput,
    cajasInput: empaque.cajasInput,
    presentacion: empaque.presentacion,
    precioUnitario: params.precioDoc ?? params.precioCatalogo,
    precioManual: params.precioDoc != null,
    packHint: empaque.packHint,
    autoPackFields: empaque.autoPackFields,
    especificacionEnvase: "",
  };
}
