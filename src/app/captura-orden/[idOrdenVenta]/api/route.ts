import { after, NextResponse } from "next/server";
import {
  cargarIntento,
  crearIntento,
  leerIntentos,
  prepararReintento,
} from "@/modules/sales/ordenes/surtido/captura-intento.service";
import { getOrdenMetaPublica } from "@/modules/sales/ordenes/surtido/orden-surtido.service";
import {
  mensajeErrorCaptura,
  procesarFotoSurtido,
  procesarIntento,
  type EntradaFoto,
} from "@/modules/sales/ordenes/surtido/procesar-captura-foto";
import { responderLectura } from "./captura-lecturas";
import {
  jsonOrRedirect,
  noCache,
  readFotoFromForm,
  readOtFromRequest,
  wantsDocumentResponse,
} from "./captura-respuestas";

/**
 * Fuera de `/api/*` para no pasar por el rewrite hacia Nest.
 * Ruta pública sin login (QR). Acepta FormData (fetch/XHR o form nativo).
 *
 * La foto se recibe y se responde 202 en cuanto queda reservada (REQ-247); la IA, el
 * guardado y el avance de la OV siguen en `after()` hasta `maxDuration`. Cada foto es su
 * propia invocación, así que varias fotos se procesan en paralelo sin esperarse.
 * El estado de cada una se lee con `GET ?intentos=id1,id2`.
 * Sin JavaScript (formulario nativo) se procesa en la misma petición y se redirige.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ idOrdenVenta: string }> };
type DatosOv = { codigoCuenta: string; folio: string };

const MAX_BYTES_FOTO = 10 * 1024 * 1024;
const MENSAJE_FOTO_NO_GUARDADA = "La foto no se guardó. Tómala de nuevo.";

/** Una OV no cambia de cuenta: evita volver a buscarla en cada foto y en cada consulta de estado. */
const datosPorOv = new Map<string, DatosOv>();

async function resolverOv(idOrdenVenta: string, ot: string): Promise<DatosOv | null> {
  const guardado = datosPorOv.get(idOrdenVenta);
  if (guardado) return guardado;
  const meta = await getOrdenMetaPublica(idOrdenVenta, ot || null);
  if (!meta) return null;
  const datos = { codigoCuenta: meta.codigoCuenta, folio: meta.folio };
  datosPorOv.set(idOrdenVenta, datos);
  return datos;
}

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  const { idOrdenVenta: rawId } = await context.params;
  const idOrdenVenta = rawId?.trim() ?? "";
  if (!idOrdenVenta) {
    return NextResponse.json({ error: "Falta id de orden." }, { status: 400 });
  }

  const idOrdenTrabajo = readOtFromRequest(request);
  const searchParams = new URL(request.url).searchParams;
  const idsIntentos = (searchParams.get("intentos") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  try {
    if (idsIntentos.length > 0) {
      const datos = await resolverOv(idOrdenVenta, idOrdenTrabajo);
      if (!datos) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
      const intentos = await leerIntentos({
        ids: idsIntentos,
        idOrdenVenta,
        codigoCuenta: datos.codigoCuenta,
      });
      return noCache(NextResponse.json({ intentos }));
    }

    const meta = await getOrdenMetaPublica(idOrdenVenta, idOrdenTrabajo || null);
    if (!meta) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    return await responderLectura({ meta, idOrdenVenta, idOrdenTrabajo, searchParams });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar la orden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Sin JavaScript: se procesa en la misma petición y se redirige con el resultado. */
async function responderSincrono(
  request: Request,
  folio: string,
  entrada: EntradaFoto,
): Promise<NextResponse> {
  const resultado = await procesarFotoSurtido(entrada);
  if (!resultado.ok) {
    return jsonOrRedirect(
      request,
      entrada.idOrdenVenta,
      resultado.idOrdenTrabajo,
      {
        error: resultado.error,
        codigo: resultado.codigo,
        detail: resultado.detalle,
        motivoIa: resultado.motivoIa ?? null,
        precisionEstimada: resultado.precisionEstimada,
      },
      resultado.status,
    );
  }
  return jsonOrRedirect(
    request,
    entrada.idOrdenVenta,
    resultado.idOrdenTrabajo,
    {
      ok: true,
      folio,
      idOrdenTrabajo: resultado.idOrdenTrabajo,
      precisionEstimada: resultado.precisionEstimada,
      captura: resultado.captura,
      estadoAlistamiento: resultado.estadoAlistamiento,
      ovSync: resultado.ovSync,
    },
    200,
  );
}

/** Reprocesa la foto ya guardada de un intento que falló, sin volver a tomarla. */
async function reintentarIntento(
  request: Request,
  idOrdenVenta: string,
  idIntento: string,
): Promise<NextResponse> {
  const idOrdenTrabajo = readOtFromRequest(request);
  const datos = await resolverOv(idOrdenVenta, idOrdenTrabajo);
  if (!datos) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });

  const cargado = await cargarIntento({
    idIntento,
    idOrdenVenta,
    codigoCuenta: datos.codigoCuenta,
  });
  if (!cargado) return NextResponse.json({ error: "No se encontró esa foto." }, { status: 404 });

  const { ref, intento } = cargado;
  if (intento.estado !== "fallo") {
    const error =
      intento.estado === "lista" ? "Esa foto ya se procesó." : "Esa foto todavía se está procesando.";
    return NextResponse.json({ error, codigo: "no_reintentable" }, { status: 409 });
  }

  const sinFoto = () =>
    NextResponse.json({ error: MENSAJE_FOTO_NO_GUARDADA, codigo: "sin_foto" }, { status: 409 });
  if (!intento.urlFoto) return sinFoto();
  const foto = await fetch(intento.urlFoto).catch(() => null);
  if (!foto?.ok) return sinFoto();

  const buffer = Buffer.from(await foto.arrayBuffer());
  const numeroIntento = intento.numeroIntento + 1;
  await prepararReintento(ref, numeroIntento);

  after(async () => {
    await procesarIntento(ref, {
      idOrdenVenta,
      idOrdenTrabajo,
      codigoCuenta: datos.codigoCuenta,
      buffer,
      nombre: "hoja-surtido.jpg",
      mime: foto.headers.get("content-type") || "image/jpeg",
      urlFotoGuardada: intento.urlFoto,
    });
  });

  return NextResponse.json({ ok: true, estado: "recibida", idIntento, numeroIntento }, { status: 202 });
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  const { idOrdenVenta: rawId } = await context.params;
  const idOrdenVenta = rawId?.trim() ?? "";
  if (!idOrdenVenta) {
    return jsonOrRedirect(request, idOrdenVenta || "invalid", "", { error: "Falta id de orden." }, 400);
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return jsonOrRedirect(
      request,
      idOrdenVenta,
      "",
      { error: "Falta configurar OPENAI_API_KEY en el servidor." },
      503,
    );
  }

  let idOrdenTrabajo = "";
  try {
    const idReintento = new URL(request.url).searchParams.get("reintentar")?.trim();
    if (idReintento) return await reintentarIntento(request, idOrdenVenta, idReintento);

    const form = await request.formData();
    idOrdenTrabajo = readOtFromRequest(request, form);

    const datos = await resolverOv(idOrdenVenta, idOrdenTrabajo);
    if (!datos) {
      return jsonOrRedirect(request, idOrdenVenta, idOrdenTrabajo, { error: "Orden no encontrada." }, 404);
    }

    const file = readFotoFromForm(form);
    if (!file) {
      return jsonOrRedirect(
        request,
        idOrdenVenta,
        idOrdenTrabajo,
        { error: "Adjunta una foto de la hoja llenada." },
        400,
      );
    }
    if (file.size <= 0 || file.size > MAX_BYTES_FOTO) {
      return jsonOrRedirect(
        request,
        idOrdenVenta,
        idOrdenTrabajo,
        {
          error:
            "La foto es demasiado pesada (máx. 10 MB). Vuelve a tomarla; en el celular se comprime sola si hace falta.",
        },
        400,
      );
    }

    const entrada: EntradaFoto = {
      idOrdenVenta,
      idOrdenTrabajo,
      codigoCuenta: datos.codigoCuenta,
      buffer: Buffer.from(await file.arrayBuffer()),
      nombre: file.name || "hoja-surtido.jpg",
      mime: file.type || "image/jpeg",
    };

    if (wantsDocumentResponse(request)) {
      return await responderSincrono(request, datos.folio, entrada);
    }

    const ref = await crearIntento({
      idOrdenVenta,
      idOrdenTrabajo,
      codigoCuenta: datos.codigoCuenta,
    });
    after(async () => {
      await procesarIntento(ref, entrada);
    });

    return NextResponse.json(
      { ok: true, estado: "recibida", idIntento: ref.idIntento, folio: datos.folio },
      { status: 202 },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "No se pudo procesar la foto de la orden.";
    console.error("[captura-orden] POST falló:", detail, error);
    return jsonOrRedirect(
      request,
      idOrdenVenta,
      idOrdenTrabajo,
      { error: mensajeErrorCaptura(error), detail },
      500,
    );
  }
}
