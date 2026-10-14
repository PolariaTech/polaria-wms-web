"use client";

import { useAuthStore } from "@/stores/auth.store";
import {
  getImpresoraActivaCuenta,
  type ImpresoraPrintTarget,
} from "@/modules/configurator/impresoras/services/impresoras.service";
import { printPdfViaQzTray } from "./qz-tray-print";

export type SilentPrintResult = {
  via: "ipp" | "qz-tray" | "email" | "epson_connect";
  impresora: string;
};

async function tryServerPrint(input: {
  codigoCuenta: string;
  pdfBase64: string;
  jobName: string;
}): Promise<
  | { ok: true; via: "ipp" | "email" | "epson_connect"; impresora: string }
  | { ok: false; code?: string; target?: ImpresoraPrintTarget; error: string }
> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    return { ok: false, error: "Sesión requerida." };
  }

  const response = await fetch("/api/ventas/imprimir-orden", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    code?: string;
    impresora?: string;
    via?: "ipp" | "email" | "epson_connect";
    target?: ImpresoraPrintTarget;
  };

  if (response.ok && data.ok) {
    return {
      ok: true,
      via: data.via ?? "ipp",
      impresora: data.impresora || "Impresora",
    };
  }

  return {
    ok: false,
    code: data.code,
    target: data.target,
    error: data.error || "No se pudo imprimir desde el servidor.",
  };
}

/**
 * Imprime el PDF según el camino de la impresora de la cuenta:
 * - email / epson_connect → servidor (SMTP / Epson)
 * - ipp → servidor (LAN) con fallback QZ
 * - agente / sistema_local / raw → QZ Tray
 */
export async function printPdfSilentToCuenta(input: {
  codigoCuenta: string;
  pdfBase64: string;
  jobName: string;
}): Promise<SilentPrintResult> {
  const codigoCuenta = input.codigoCuenta.trim();
  if (!codigoCuenta) {
    throw new Error("Falta la cuenta para imprimir.");
  }

  let target = await getImpresoraActivaCuenta(codigoCuenta);
  if (!target) {
    throw new Error(
      "No hay impresora configurada para esta cuenta. Ve a Configurador → Asignación → Impresoras.",
    );
  }

  if (target.modoEnvio === "email" || target.modoEnvio === "epson_connect") {
    const cloud = await tryServerPrint({
      codigoCuenta,
      pdfBase64: input.pdfBase64,
      jobName: input.jobName,
    });
    if (cloud.ok) {
      return { via: cloud.via, impresora: cloud.impresora };
    }
    throw new Error(cloud.error);
  }

  const preferAgent =
    target.modoEnvio === "agente" || target.modoEnvio === "sistema_local";

  if (!preferAgent && target.modoEnvio === "ipp") {
    const ipp = await tryServerPrint({
      codigoCuenta,
      pdfBase64: input.pdfBase64,
      jobName: input.jobName,
    });
    if (ipp.ok) {
      return { via: "ipp", impresora: ipp.impresora };
    }
    if (ipp.target) target = ipp.target;
  }

  try {
    await printPdfViaQzTray({
      target,
      pdfBase64: input.pdfBase64,
    });
    return { via: "qz-tray", impresora: target.nombre };
  } catch (err) {
    const qzMessage =
      err instanceof Error ? err.message : "Falló la impresión con QZ Tray.";

    if (target.modoEnvio === "ipp" && target.hostIp) {
      throw new Error(
        `${qzMessage}\n\nLa impresora (${target.hostIp}) está en la red local: el servidor en la nube no puede alcanzarla. Instala QZ Tray en este PC (https://qz.io/download/), agrega la impresora en Windows con el mismo nombre «${target.nombreSistema || target.nombre}», deja QZ abierto y vuelve a imprimir.`,
      );
    }

    throw new Error(qzMessage);
  }
}
