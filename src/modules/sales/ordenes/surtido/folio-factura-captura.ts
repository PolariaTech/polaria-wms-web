import { useEffect, useState } from "react";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

/** Mismo orden que el bloque FOLIO del Cypher. La primera con texto gana. */
export const CLAVES_FOLIO_FACTURA = [
  "facturaOkFolio",
  "facturaAsociada",
  "Folio factura asociada",
  "Factura (OK) folio",
  "Documentación folio",
  "Folio",
] as const;

export const FOLIO_FACTURA_ACTUALIZADO = "polaria-folio-factura-actualizado";

export function useRecargaFolioFactura(idOrdenVenta: string): number {
  const [recarga, setRecarga] = useState(0);
  useEffect(() => {
    function onFolio(event: Event) {
      const id = (event as CustomEvent<{ idOrdenVenta?: string }>).detail
        ?.idOrdenVenta;
      if (id === idOrdenVenta) setRecarga((value) => value + 1);
    }
    window.addEventListener(FOLIO_FACTURA_ACTUALIZADO, onFolio);
    return () => window.removeEventListener(FOLIO_FACTURA_ACTUALIZADO, onFolio);
  }, [idOrdenVenta]);
  return recarga;
}

export function leerFolioFactura(
  campos: Record<string, string> | undefined,
): string {
  if (!campos) return "";
  for (const key of CLAVES_FOLIO_FACTURA) {
    const direct = campos[key]?.trim();
    if (direct) return direct;
  }
  const lower = Object.fromEntries(
    Object.entries(campos).map(([key, value]) => [key.toLowerCase(), value]),
  );
  for (const key of CLAVES_FOLIO_FACTURA) {
    const value = lower[key.toLowerCase()]?.trim();
    if (value) return value;
  }
  return "";
}

export function payloadCapturaVacio(): OrdenSurtidoCapturaPayload {
  return { campos: {}, checks: {}, lineas: [] };
}

/** Escribe `facturaOkFolio` y quita los alias, para que el Cypher no siga mostrando el valor viejo. */
export function escribirFolioFactura(
  payload: OrdenSurtidoCapturaPayload | null | undefined,
  folio: string,
): OrdenSurtidoCapturaPayload {
  const base = payload ?? payloadCapturaVacio();
  const campos = { ...base.campos };
  for (const key of Object.keys(campos)) {
    if (
      CLAVES_FOLIO_FACTURA.some(
        (clave) => clave.toLowerCase() === key.toLowerCase(),
      )
    ) {
      delete campos[key];
    }
  }
  const valor = folio.trim();
  if (valor) campos.facturaOkFolio = valor;
  return { ...base, campos };
}
