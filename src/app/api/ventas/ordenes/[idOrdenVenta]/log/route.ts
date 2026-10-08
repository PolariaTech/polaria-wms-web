import { NextResponse } from "next/server";
import type { TipoAuditoria } from "@/modules/audit/types/audit.types";
import {
  listOrdenVentaLogServer,
  recordOrdenVentaLogServer,
} from "@/modules/sales/ordenes/services/orden-venta-log.server";

type RouteContext = {
  params: Promise<{ idOrdenVenta: string }>;
};

function readBearer(request: Request): string {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
}

const ACCIONES: ReadonlySet<string> = new Set([
  "creacion",
  "actualizacion",
  "eliminacion",
  "cambio_estado",
  "movimiento_inventario",
  "acceso_denegado",
]);

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = readBearer(request);
  if (!accessToken) {
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  }

  const { idOrdenVenta: rawId } = await context.params;
  const idOrdenVenta = rawId?.trim() ?? "";
  const search = new URL(request.url).searchParams;
  const codigoCuenta = search.get("codigoCuenta")?.trim() ?? "";
  const idOrdenTrabajo = search.get("idOrdenTrabajo")?.trim() || null;
  const fallbackCreatedAt = search.get("createdAt")?.trim() || null;
  const fallbackAutor = search.get("autor")?.trim() || null;

  if (!idOrdenVenta || !codigoCuenta) {
    return NextResponse.json(
      { error: "Faltan idOrdenVenta o codigoCuenta." },
      { status: 400 },
    );
  }

  try {
    const entries = await listOrdenVentaLogServer({
      idOrdenVenta,
      codigoCuenta,
      idOrdenTrabajo,
      fallbackCreatedAt,
      fallbackAutor,
    });
    return NextResponse.json({ entries });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo cargar el log.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = readBearer(request);
  if (!accessToken) {
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  }

  const { idOrdenVenta: rawId } = await context.params;
  const idOrdenVenta = rawId?.trim() ?? "";

  let body: {
    codigoCuenta?: string;
    accion?: string;
    mensaje?: string;
    idBodega?: string | null;
    idUsuario?: string | null;
    autorNombre?: string | null;
    idOrdenTrabajo?: string | null;
    payloadExtra?: Record<string, unknown>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const codigoCuenta = String(body.codigoCuenta ?? "").trim();
  const accion = String(body.accion ?? "").trim();
  const mensaje = String(body.mensaje ?? "").trim();

  if (!idOrdenVenta || !codigoCuenta || !mensaje) {
    return NextResponse.json(
      { error: "Faltan idOrdenVenta, codigoCuenta o mensaje." },
      { status: 400 },
    );
  }
  if (!ACCIONES.has(accion)) {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  try {
    const entry = await recordOrdenVentaLogServer({
      idOrdenVenta,
      codigoCuenta,
      idBodega: body.idBodega,
      idUsuario: body.idUsuario,
      accion: accion as TipoAuditoria,
      mensaje,
      autorNombre: body.autorNombre,
      idOrdenTrabajo: body.idOrdenTrabajo,
      payloadExtra: body.payloadExtra,
    });
    return NextResponse.json({ entry }, { status: entry ? 201 : 202 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo registrar el log.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
