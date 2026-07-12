import { NextResponse } from "next/server";
import {
  countAlertasOperativasHistorialServer,
  syncDemoraAlertasHistorialServer,
} from "@/modules/warehouses/estado-bodega/services/estado-bodega-demora-alerta-sync.server";

interface SyncDemoraAlertasBody {
  codigoCuenta?: string;
  idBodega?: string;
}

export interface SyncDemoraAlertasResponse {
  ok: boolean;
  persisted: number;
  alertasTotal: number;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: SyncDemoraAlertasBody;

  try {
    body = (await request.json()) as SyncDemoraAlertasBody;
  } catch {
    return NextResponse.json(
      { ok: false, persisted: 0, alertasTotal: 0, error: "Body JSON inválido." },
      { status: 400 },
    );
  }

  const codigoCuenta = body.codigoCuenta?.trim();
  const idBodega = body.idBodega?.trim();

  if (!codigoCuenta || !idBodega) {
    return NextResponse.json(
      {
        ok: false,
        persisted: 0,
        alertasTotal: 0,
        error: "Faltan codigoCuenta o idBodega.",
      },
      { status: 400 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json(
      {
        ok: false,
        persisted: 0,
        alertasTotal: 0,
        error: "Sesión requerida.",
      },
      { status: 401 },
    );
  }

  try {
    const result = await syncDemoraAlertasHistorialServer({
      codigoCuenta,
      idBodega,
    });

    return NextResponse.json({
      ok: true,
      persisted: result.persisted,
      alertasTotal: result.alertasTotal,
    } satisfies SyncDemoraAlertasResponse);
  } catch (error) {
    const alertasTotal = await countAlertasOperativasHistorialServer({
      codigoCuenta,
      idBodega,
    }).catch(() => 0);

    return NextResponse.json(
      {
        ok: false,
        persisted: 0,
        alertasTotal,
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron sincronizar alertas de demora.",
      } satisfies SyncDemoraAlertasResponse,
      { status: 500 },
    );
  }
}
