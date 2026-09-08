import { NextResponse } from "next/server";
import { extractFiles } from "@/modules/sales/ordenes/ai/file-extractors";
import { uploadEvidenciaImage } from "@/lib/cloudinary/upload-evidencia";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { ROUTES } from "@/config/routes";
import { extraerSurtidoDesdeFoto } from "@/modules/sales/ordenes/surtido/openai-surtido.client";
import {
  buildPrintDataAdmin,
  getOrdenMetaPublica,
  getOrdenSurtidoCaptura,
  upsertOrdenSurtidoCaptura,
} from "@/modules/sales/ordenes/surtido/orden-surtido.service";

/**
 * Fuera de `/api/*` para no pasar por el rewrite hacia Nest.
 * Ruta pública sin login (QR). Soporta fetch JSON y form nativo (iOS).
 */
type RouteContext = { params: Promise<{ idOrdenVenta: string }> };

function wantsDocumentResponse(request: Request): boolean {
  const mode = request.headers.get("sec-fetch-mode");
  if (mode === "navigate" || mode === "nested-navigate") return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html") && !accept.includes("application/json");
}

function redirectCaptura(
  request: Request,
  idOrdenVenta: string,
  result: { ok: true } | { ok: false; error: string },
): NextResponse {
  const url = new URL(ROUTES.capturaOrden(idOrdenVenta), request.url);
  if (result.ok) {
    url.searchParams.set("captura", "ok");
  } else {
    url.searchParams.set("captura", "error");
    url.searchParams.set("msg", result.error.slice(0, 180));
  }
  return NextResponse.redirect(url, 303);
}

function jsonOrRedirect(
  request: Request,
  idOrdenVenta: string,
  payload: Record<string, unknown>,
  status: number,
): NextResponse {
  if (wantsDocumentResponse(request)) {
    const error =
      typeof payload.error === "string"
        ? payload.error
        : status >= 400
          ? "No se pudo procesar la foto."
          : "";
    if (status >= 400) {
      return redirectCaptura(request, idOrdenVenta, {
        ok: false,
        error: error || "No se pudo procesar la foto.",
      });
    }
    return redirectCaptura(request, idOrdenVenta, { ok: true });
  }
  return NextResponse.json(payload, { status });
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { idOrdenVenta: rawId } = await context.params;
  const idOrdenVenta = rawId?.trim() ?? "";
  if (!idOrdenVenta) {
    return NextResponse.json({ error: "Falta id de orden." }, { status: 400 });
  }

  try {
    const meta = await getOrdenMetaPublica(idOrdenVenta);
    if (!meta) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }
    const captura = meta.tieneCaptura
      ? await getOrdenSurtidoCaptura(idOrdenVenta)
      : null;
    return NextResponse.json({
      idOrdenVenta: meta.idOrdenVenta,
      folio: meta.folio,
      tieneCaptura: meta.tieneCaptura,
      capturaActualizadaEn: captura?.updatedAt ?? null,
      captura: captura
        ? {
            payload: captura.payload,
            urlFoto: captura.urlFoto,
            modelo: captura.modelo,
            updatedAt: captura.updatedAt,
          }
        : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo cargar la orden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { idOrdenVenta: rawId } = await context.params;
  const idOrdenVenta = rawId?.trim() ?? "";
  if (!idOrdenVenta) {
    return jsonOrRedirect(
      request,
      idOrdenVenta || "invalid",
      { error: "Falta id de orden." },
      400,
    );
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return jsonOrRedirect(
      request,
      idOrdenVenta,
      { error: "Falta configurar OPENAI_API_KEY en el servidor." },
      503,
    );
  }

  try {
    const meta = await getOrdenMetaPublica(idOrdenVenta);
    if (!meta) {
      return jsonOrRedirect(
        request,
        idOrdenVenta,
        { error: "Orden no encontrada." },
        404,
      );
    }

    const form = await request.formData();
    const file = form.get("foto");
    if (!(file instanceof File)) {
      return jsonOrRedirect(
        request,
        idOrdenVenta,
        { error: "Adjunta una foto de la hoja llenada." },
        400,
      );
    }

    if (file.size <= 0 || file.size > 15 * 1024 * 1024) {
      return jsonOrRedirect(
        request,
        idOrdenVenta,
        { error: "La foto debe pesar entre 1 byte y 15 MB." },
        400,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const extracted = await extractFiles([
      {
        originalname: file.name || "hoja-surtido.jpg",
        mimetype: mime,
        buffer,
      },
    ]);
    const imagen = extracted.find((item) => item.tipo === "imagen");
    if (!imagen || imagen.tipo !== "imagen") {
      return jsonOrRedirect(
        request,
        idOrdenVenta,
        {
          error:
            "No se pudo leer la imagen. Prueba JPG desde la galería (no HEIC).",
        },
        400,
      );
    }

    const original = await buildPrintDataAdmin(idOrdenVenta);
    if (!original) {
      return jsonOrRedirect(
        request,
        idOrdenVenta,
        { error: "Orden no encontrada." },
        404,
      );
    }

    const { payload, modelo } = await extraerSurtidoDesdeFoto({
      original,
      mime: imagen.mime,
      base64: imagen.base64,
    });

    let urlFoto: string | null = null;
    try {
      const blobFile = new File([buffer], file.name || "hoja-surtido.jpg", {
        type: imagen.mime,
      });
      const uploaded = await uploadEvidenciaImage(blobFile);
      if (uploaded.ok) urlFoto = uploaded.url;
    } catch {
      urlFoto = null;
    }

    const captura = await upsertOrdenSurtidoCaptura({
      idOrdenVenta,
      codigoCuenta: meta.codigoCuenta,
      urlFoto,
      payload,
      modelo,
    });

    const admin = getSupabaseAdminClient();
    if (admin) {
      await admin
        .from("orden_venta")
        .update({ updated_at: new Date().toISOString() })
        .eq("id_orden_venta", idOrdenVenta);
    }

    return jsonOrRedirect(
      request,
      idOrdenVenta,
      { ok: true, folio: meta.folio, captura },
      200,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo procesar la foto de la orden.";
    return jsonOrRedirect(request, idOrdenVenta, { error: message }, 500);
  }
}
