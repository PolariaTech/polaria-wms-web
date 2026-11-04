import { NextResponse } from "next/server";
import { ROUTES } from "@/config/routes";
import { normalizeIdOrdenTrabajo } from "@/modules/sales/ordenes/utils/origen/origen-correo-ordenes-trabajo";

/** Helpers de respuesta de la ruta de captura: JSON para fetch, redirección para formulario nativo. */

export function wantsDocumentResponse(request: Request): boolean {
  const mode = request.headers.get("sec-fetch-mode");
  if (mode === "navigate" || mode === "nested-navigate") return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html") && !accept.includes("application/json");
}

export function readOtFromRequest(request: Request, form?: FormData): string {
  const urlOt = normalizeIdOrdenTrabajo(new URL(request.url).searchParams.get("ot"));
  if (urlOt) return urlOt;
  if (!form) return "";
  const raw = form.get("ot") ?? form.get("idOrdenTrabajo");
  return typeof raw === "string" ? normalizeIdOrdenTrabajo(raw) : "";
}

export function readFotoFromForm(form: FormData): File | null {
  const raw = form.get("foto") ?? form.get("file") ?? form.get("image");
  if (raw instanceof File && raw.size > 0) return raw;
  if (raw instanceof Blob && raw.size > 0) {
    return new File([raw], "hoja-surtido.jpg", {
      type: raw.type || "image/jpeg",
      lastModified: Date.now(),
    });
  }
  return null;
}

function redirectCaptura(
  request: Request,
  idOrdenVenta: string,
  idOrdenTrabajo: string,
  result: { ok: true; precision?: number } | { ok: false; error: string },
): NextResponse {
  const url = new URL(ROUTES.capturaOrden(idOrdenVenta, idOrdenTrabajo || undefined), request.url);
  if (result.ok) {
    url.searchParams.set("captura", "ok");
    if (typeof result.precision === "number") {
      url.searchParams.set("precision", String(result.precision));
    }
  } else {
    url.searchParams.set("captura", "error");
    url.searchParams.set("msg", result.error.slice(0, 180));
  }
  return NextResponse.redirect(url, 303);
}

export function jsonOrRedirect(
  request: Request,
  idOrdenVenta: string,
  idOrdenTrabajo: string,
  payload: Record<string, unknown>,
  status: number,
): NextResponse {
  if (!wantsDocumentResponse(request)) {
    return NextResponse.json(payload, { status });
  }
  if (status >= 400) {
    const error = typeof payload.error === "string" ? payload.error : "";
    return redirectCaptura(request, idOrdenVenta, idOrdenTrabajo, {
      ok: false,
      error: error || "No se pudo procesar la foto.",
    });
  }
  return redirectCaptura(request, idOrdenVenta, idOrdenTrabajo, {
    ok: true,
    precision: typeof payload.precisionEstimada === "number" ? payload.precisionEstimada : undefined,
  });
}

export function noCache(respuesta: NextResponse): NextResponse {
  respuesta.headers.set("Cache-Control", "no-store");
  return respuesta;
}
