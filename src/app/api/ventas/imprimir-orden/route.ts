import { NextResponse } from "next/server";
import { getImpresoraActivaCuenta } from "@/modules/configurator/impresoras/services/impresoras.service";
import { printPdfViaIpp } from "@/modules/sales/ordenes/print/ipp-print.server";

/**
 * Intenta imprimir por IPP desde el servidor.
 * Si la impresora está en LAN privada (10.x / 192.168.x), Vercel no la alcanza:
 * el cliente debe usar QZ Tray. Esta ruta sirve cuando el Node corre en la misma red.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  }

  let body: {
    codigoCuenta?: string;
    pdfBase64?: string;
    jobName?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const codigoCuenta = String(body.codigoCuenta ?? "").trim();
  const pdfBase64 = String(body.pdfBase64 ?? "").trim();
  const jobName = String(body.jobName ?? "Orden Polaria").trim() || "Orden Polaria";

  if (!codigoCuenta) {
    return NextResponse.json({ error: "Falta codigoCuenta." }, { status: 400 });
  }
  if (!pdfBase64) {
    return NextResponse.json({ error: "Falta el PDF." }, { status: 400 });
  }

  const target = await getImpresoraActivaCuenta(codigoCuenta);
  if (!target) {
    return NextResponse.json(
      {
        error:
          "No hay impresora activa para esta cuenta. Configúrala en Configurador → Impresoras.",
        code: "NO_PRINTER",
      },
      { status: 404 },
    );
  }

  if (target.modoEnvio !== "ipp" && target.modoEnvio !== "raw_9100") {
    return NextResponse.json(
      {
        error: "Esta impresora no usa IPP/JetDirect; el cliente debe usar QZ Tray.",
        code: "USE_AGENT",
        target,
      },
      { status: 409 },
    );
  }

  if (target.modoEnvio === "raw_9100") {
    return NextResponse.json(
      {
        error: "JetDirect 9100 requiere agente local (QZ Tray).",
        code: "USE_AGENT",
        target,
      },
      { status: 409 },
    );
  }

  const result = await printPdfViaIpp({ target, pdfBase64, jobName });
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        code: "IPP_UNREACHABLE",
        target,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    via: "ipp",
    url: result.url,
    impresora: target.nombre,
  });
}
