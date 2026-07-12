import { NextResponse } from "next/server";
import { listProductosVentaCatalogoServer } from "@/modules/sales/shared/services/sales-catalog.server";

export async function GET(request: Request): Promise<NextResponse> {
  const codigoCuenta =
    new URL(request.url).searchParams.get("codigoCuenta")?.trim() ?? "";

  if (!codigoCuenta) {
    return NextResponse.json(
      { error: "Falta codigoCuenta." },
      { status: 400 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  }

  try {
    const productos = await listProductosVentaCatalogoServer(codigoCuenta);
    return NextResponse.json(productos);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cargar el catálogo de venta.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
