import { NextResponse } from "next/server";
import { getCuentaOvAutoImprimirServer } from "@/modules/configurator/cuentas/services/cuenta-ov-auto-imprimir.server";

/**
 * Flag de autoimpresión OV para la cuenta (lectura privilegiada).
 * Usado por el operador al Validar y enviar — no depende de RLS del client.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  }

  const codigoCuenta =
    new URL(request.url).searchParams.get("codigoCuenta")?.trim() ?? "";
  if (!codigoCuenta) {
    return NextResponse.json(
      { error: "Falta codigoCuenta." },
      { status: 400 },
    );
  }

  try {
    const autoImprimir = await getCuentaOvAutoImprimirServer(codigoCuenta);
    return NextResponse.json({ ok: true, autoImprimir });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo leer la configuración de autoimpresión.",
      },
      { status: 500 },
    );
  }
}
