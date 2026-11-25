"use client";

import { useEffect, useState } from "react";
import {
  buscarOvsDelMismoCorreo,
  type OvDelMismoCorreo,
} from "../../../shared/services/ovs-del-mismo-correo";

/** REQ-313 / REQ-347: OV del mismo correo. Si la consulta falla, usa el fallback del listado. */
export function useOvsDelMismoCorreo(input: {
  codigoCuenta: string;
  idOrdenVenta: string;
  origenArchivos: string | null | undefined;
  /** Cuando el listado ya marcó correo partido (REQ-338) y la query aún no trae hermanas. */
  fallbackHermanas?: readonly OvDelMismoCorreo[];
}): { hermanas: OvDelMismoCorreo[]; cargando: boolean } {
  const { codigoCuenta, idOrdenVenta, origenArchivos, fallbackHermanas } = input;
  const [estado, setEstado] = useState<{
    clave: string;
    hermanas: OvDelMismoCorreo[];
  } | null>(null);
  const clave = `${codigoCuenta}|${idOrdenVenta}|${origenArchivos ?? ""}`;

  useEffect(() => {
    let vigente = true;
    buscarOvsDelMismoCorreo({ codigoCuenta, origenArchivos })
      .then((hermanas) => {
        if (vigente) setEstado({ clave, hermanas });
      })
      .catch((error: unknown) => {
        console.warn("No se pudieron buscar las OV del mismo correo", error);
        if (vigente) setEstado({ clave, hermanas: [] });
      });
    return () => {
      vigente = false;
    };
  }, [clave, codigoCuenta, origenArchivos]);

  const listo = estado?.clave === clave;
  const consultadas = listo ? estado.hermanas : [];
  const fallback =
    fallbackHermanas && fallbackHermanas.length >= 2 ? [...fallbackHermanas] : [];
  const hermanas = consultadas.length >= 2 ? consultadas : fallback;
  return { hermanas, cargando: !listo && fallback.length < 2 };
}
