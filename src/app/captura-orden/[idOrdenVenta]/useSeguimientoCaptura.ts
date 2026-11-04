"use client";

import { useEffect, useRef } from "react";
import { ROUTES } from "@/config/routes";
import { registrarCaptura, type RegistroCaptura } from "./captura-sesion";

/**
 * Sigue las fotos que el servidor está procesando (REQ-247): pregunta su estado cada pocos
 * segundos y deja el resultado en el registro del celular, que las demás pestañas leen.
 * Cubre las fotos de todas las hojas, no solo la de esta pestaña: así el resultado llega
 * aunque ya hayas pasado a escanear otra. Solo consulta la pestaña que se está viendo,
 * para que 50 pestañas abiertas no multipliquen las peticiones por 50.
 */

const CADA_MS = 3000;

interface IntentoRemoto {
  idIntento: string;
  estado: string;
  mensajeError: string | null;
}

function agruparPorOv(registros: RegistroCaptura[]): Map<string, RegistroCaptura[]> {
  const grupos = new Map<string, RegistroCaptura[]>();
  for (const registro of registros) {
    grupos.set(registro.idOrdenVenta, [...(grupos.get(registro.idOrdenVenta) ?? []), registro]);
  }
  return grupos;
}

async function consultarOv(idOrdenVenta: string, lista: RegistroCaptura[]): Promise<void> {
  const ids = lista.map((r) => encodeURIComponent(r.idIntento ?? "")).join(",");
  const respuesta = await fetch(`${ROUTES.capturaOrdenApi(idOrdenVenta)}?intentos=${ids}`, {
    cache: "no-store",
  }).catch(() => null);
  if (!respuesta?.ok) return;
  const datos = (await respuesta.json().catch(() => null)) as { intentos?: IntentoRemoto[] } | null;

  for (const intento of datos?.intentos ?? []) {
    if (intento.estado !== "lista" && intento.estado !== "fallo") continue;
    const registro = lista.find((r) => r.idIntento === intento.idIntento);
    if (!registro) continue;
    registrarCaptura({
      ...registro,
      estado: intento.estado,
      mensaje: intento.estado === "fallo" ? (intento.mensajeError ?? undefined) : undefined,
      at: Date.now(),
    });
  }
}

export function useSeguimientoCaptura(registros: RegistroCaptura[]): void {
  const pendientes = registros.filter((r) => r.estado === "procesando" && r.idIntento);
  const clave = pendientes.map((r) => `${r.idOrdenVenta}|${r.idOrdenTrabajo}|${r.idIntento}`).join(";");
  const pendientesRef = useRef<RegistroCaptura[]>([]);

  useEffect(() => {
    pendientesRef.current = pendientes;
  });

  useEffect(() => {
    if (!clave) return;
    let activo = true;
    let enVuelo = false;

    const consultar = async () => {
      if (enVuelo || !activo || document.visibilityState === "hidden") return;
      enVuelo = true;
      try {
        await Promise.all(
          [...agruparPorOv(pendientesRef.current)].map(([ov, lista]) => consultarOv(ov, lista)),
        );
      } finally {
        enVuelo = false;
      }
    };

    void consultar();
    const reloj = window.setInterval(() => void consultar(), CADA_MS);
    const alVolver = () => void consultar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      activo = false;
      window.clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [clave]);
}
