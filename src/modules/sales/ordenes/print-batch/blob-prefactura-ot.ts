import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";
import { cargarCompradorPrefactura } from "./cargar-comprador-prefactura";
import { cargarEmpresaPrefactura } from "./cargar-empresa-prefactura";
import { documentosPrefactura } from "./prefactura-documento";
import { adjuntarQrRecepcion } from "./recepcion-prefactura-qr";
import { renderPrefacturasPdf } from "./render-prefactura-pdf";

/** Un PDF con la prefactura de una sola orden de tarea. */
export async function blobPrefacturaDeOt(
  detalle: OrdenVentaDetalleRow,
  codigoEmpresa: string,
  otId: string,
): Promise<Blob> {
  const codigo = codigoEmpresa.trim();
  if (!codigo) throw new Error("No se encontró la empresa de la sesión.");
  const [empresa, fiscal] = await Promise.all([
    cargarEmpresaPrefactura(codigo),
    cargarCompradorPrefactura(detalle.id_comprador),
  ]);
  const documentos = await adjuntarQrRecepcion(
    documentosPrefactura(empresa, detalle, fiscal, codigo),
  );
  const elegido = documentos.find((documento) => documento.ordenTrabajoId === otId.trim());
  if (!elegido) throw new Error("No se encontró la prefactura de esa orden de trabajo.");
  const doc = renderPrefacturasPdf([elegido]);
  return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}
