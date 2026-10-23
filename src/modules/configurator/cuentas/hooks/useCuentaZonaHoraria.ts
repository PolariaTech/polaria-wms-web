"use client";

import { useEffect, useState } from "react";
import {
  CUENTA_ZONA_HORARIA_DEFAULT,
  readCuentaZonaHoraria,
  writeCuentaZonaHoraria,
  type CuentaZonaHorariaId,
} from "@/modules/configurator/cuentas/constants/cuenta-zona-horaria";
import { getCuentaZonaHorariaConfigurator } from "@/modules/configurator/cuentas/services/cuentas.service";

/**
 * Zona IANA de la cuenta: caché local inmediata + hidratación desde BD.
 * Usar en lista OV, Cypher, log e impresión para no depender del reloj del PC.
 */
export function useCuentaZonaHoraria(
  codigoCuenta: string | null | undefined,
): CuentaZonaHorariaId {
  const codigo = codigoCuenta?.trim() || "";
  const [zona, setZona] = useState<CuentaZonaHorariaId>(() =>
    codigo ? readCuentaZonaHoraria(codigo) : CUENTA_ZONA_HORARIA_DEFAULT,
  );

  useEffect(() => {
    if (!codigo) {
      setZona(CUENTA_ZONA_HORARIA_DEFAULT);
      return;
    }
    setZona(readCuentaZonaHoraria(codigo));
    let cancelled = false;
    void getCuentaZonaHorariaConfigurator(codigo)
      .then((cfg) => {
        if (cancelled || !cfg) return;
        const next = cfg.zonaHoraria as CuentaZonaHorariaId;
        writeCuentaZonaHoraria(codigo, next);
        setZona(next);
      })
      .catch(() => {
        /* se queda en caché / default Cancún */
      });
    return () => {
      cancelled = true;
    };
  }, [codigo]);

  return zona;
}
