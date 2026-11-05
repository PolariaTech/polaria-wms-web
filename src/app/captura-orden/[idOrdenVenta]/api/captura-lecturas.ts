import { NextResponse } from "next/server";
import {
  getOrdenSurtidoCaptura,
  listOrdenSurtidoCapturaFotos,
  listOrdenSurtidoCapturaOtsConFotos,
  listOrdenSurtidoCapturas,
} from "@/modules/sales/ordenes/surtido/orden-surtido.service";

/** Lecturas del GET de captura (meta, historial de fotos y capturas de la OV). */

interface MetaOv {
  idOrdenVenta: string;
  folio: string;
}

export async function responderLectura(input: {
  meta: MetaOv;
  idOrdenVenta: string;
  idOrdenTrabajo: string;
  searchParams: URLSearchParams;
}): Promise<NextResponse> {
  const { meta, idOrdenVenta, idOrdenTrabajo, searchParams } = input;
  const encabezado = { idOrdenVenta: meta.idOrdenVenta, folio: meta.folio };
  const activo = (clave: string) => ["1", "true"].includes(searchParams.get(clave) ?? "");

  if (activo("historial")) {
    if (searchParams.has("ot") || idOrdenTrabajo) {
      const fotos = await listOrdenSurtidoCapturaFotos(idOrdenVenta, idOrdenTrabajo || "");
      return NextResponse.json({
        ...encabezado,
        idOrdenTrabajo: idOrdenTrabajo || "",
        fotos: fotos.map((foto) => ({
          idFoto: foto.idFoto,
          idOrdenTrabajo: foto.idOrdenTrabajo,
          urlFoto: foto.urlFoto,
          createdAt: foto.createdAt,
        })),
      });
    }

    const ordenesTrabajo = await listOrdenSurtidoCapturaOtsConFotos(idOrdenVenta);
    return NextResponse.json({
      ...encabezado,
      ordenesTrabajo: ordenesTrabajo.map((ot) => ({
        idOrdenTrabajo: ot.idOrdenTrabajo,
        totalFotos: ot.totalFotos,
        ultimaAt: ot.ultimaAt,
        previewUrl: ot.previewUrl,
        label: ot.label,
        numeroPedido: ot.numeroPedido,
        centroConsumo: ot.centroConsumo,
      })),
    });
  }

  if (activo("all")) {
    const capturas = await listOrdenSurtidoCapturas(idOrdenVenta);
    return NextResponse.json({
      ...encabezado,
      tieneCaptura: capturas.length > 0,
      capturas: capturas.map((captura) => ({
        idOrdenTrabajo: captura.idOrdenTrabajo,
        payload: captura.payload,
        urlFoto: captura.urlFoto,
        modelo: captura.modelo,
        updatedAt: captura.updatedAt,
        precisionEstimada: captura.payload.precisionEstimada ?? null,
      })),
    });
  }

  const captura = await getOrdenSurtidoCaptura(idOrdenVenta, idOrdenTrabajo || null);
  return NextResponse.json({
    ...encabezado,
    idOrdenTrabajo: idOrdenTrabajo || "",
    tieneCaptura: Boolean(captura),
    capturaActualizadaEn: captura?.updatedAt ?? null,
    captura: captura
      ? {
          idOrdenTrabajo: captura.idOrdenTrabajo,
          payload: captura.payload,
          urlFoto: captura.urlFoto,
          modelo: captura.modelo,
          updatedAt: captura.updatedAt,
          precisionEstimada: captura.payload.precisionEstimada ?? null,
        }
      : null,
  });
}
