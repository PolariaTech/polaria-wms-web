import QRCode from "qrcode";
import { resolveCapturaOrdenOrigin } from "@/modules/sales/ordenes/print/resolve-captura-orden-origin";
import type { PrefacturaDocumento } from "./prefactura-documento";
import { urlRecepcionPrefactura, type PantallaRecepcionPrefactura } from "./recepcion-prefactura";

/** Pega el QR de recepción en cada prefactura. Sin origen de la app, la hoja sale igual, sin código. */
export async function adjuntarQrRecepcion(
  documentos: readonly PrefacturaDocumento[],
): Promise<PrefacturaDocumento[]> {
  const origin = resolveCapturaOrdenOrigin();
  if (!origin) return [...documentos];
  return Promise.all(documentos.map((documento) => conQr(origin, documento)));
}

function pantallaDe(documento: PrefacturaDocumento): PantallaRecepcionPrefactura {
  return {
    nombreEmpresa: documento.razonSocial ?? "",
    cliente: documento.cliente ?? "",
    numeroOt: documento.numeroOt ?? "",
    totalOt: documento.totalOt ?? "",
    centroConsumo: documento.centroConsumo ?? "",
  };
}

async function conQr(origin: string, documento: PrefacturaDocumento): Promise<PrefacturaDocumento> {
  if (!documento.codigoEmpresa || !documento.folio || !documento.ordenTrabajoId) return documento;
  const enlace = urlRecepcionPrefactura(
    origin,
    documento.codigoEmpresa,
    documento.folio,
    documento.ordenTrabajoId,
    pantallaDe(documento),
  );
  const qrDataUrl = await QRCode.toDataURL(enlace, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
    color: { dark: "#000000", light: "#ffffff" },
  });
  return { ...documento, qrDataUrl };
}
