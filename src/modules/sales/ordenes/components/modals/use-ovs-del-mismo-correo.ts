"use client";

import { useEffect, useState } from "react";
import {
  buscarOvsDelMismoCorreo,
  type OvDelMismoCorreo,
} from "../../../shared/services/ovs-del-mismo-correo";

/** REQ-313: las OV que salieron del mismo correo que la abierta. Si la consulta falla, no hay hermanas. */
export function useOvsDelMismoCorreo(input: {
  codigoCuenta: string;
  idOrdenVenta: string;
  origenArchivos: string | null | undefined;
}): { hermanas: OvDelMismoCorreo[]; cargando: boolean } {
  const { codigoCuenta, idOrdenVenta, origenArchivos } = input;
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
  return { hermanas: listo ? estado.hermanas : [], cargando: !listo };
}
