"use client";

import { useAuthStore } from "@/stores/auth.store";
import {
  getImpresoraActivaCuenta,
  type ImpresoraPrintTarget,
} from "@/modules/configurator/impresoras/services/impresoras.service";
import { printPdfViaQzTray } from "./qz-tray-print";

export type SilentPrintResult = {
  via: "ipp" | "qz-tray";
  impresora: string;
};

async function tryIppFromApi(input: {
  codigoCuenta: string;
  pdfBase64: string;
  jobName: string;
}): Promise<
  | { ok: true; impresora: string }
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
    target?: ImpresoraPrintTarget;
  };

  if (response.ok && data.ok) {
    return { ok: true, impresora: data.impresora || "Impresora" };
  }

  return {
    ok: false,
    code: data.code,
    target: data.target,
    error: data.error || "No se pudo imprimir por IPP.",
  };
}

/**
 * Imprime el PDF en la impresora de la cuenta sin abrir el diálogo del navegador.
 * 1) Intenta IPP desde el servidor (si está en la misma LAN que la impresora).
 * 2) Si no alcanza, usa QZ Tray en este PC (recomendado en producción Vercel).
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

  const preferAgent =
    target.modoEnvio === "agente" || target.modoEnvio === "sistema_local";

  if (!preferAgent && target.modoEnvio === "ipp") {
    const ipp = await tryIppFromApi({
      codigoCuenta,
      pdfBase64: input.pdfBase64,
      jobName: input.jobName,
    });
    if (ipp.ok) {
      return { via: "ipp", impresora: ipp.impresora };
    }
    if (ipp.target) target = ipp.target;
    // IPP_UNREACHABLE / USE_AGENT → cae a QZ Tray
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
        `${qzMessage}\n\nLa impresora (${target.hostIp}) está en la red local: el servidor en la nube no puede alcanzarla. Instala QZ Tray en este PC (https://qz.io/download/), agrega la Epson en Windows con el mismo nombre «${target.nombreSistema || target.nombre}», deja QZ abierto y vuelve a imprimir.`,
      );
    }

    throw new Error(qzMessage);
  }
}
