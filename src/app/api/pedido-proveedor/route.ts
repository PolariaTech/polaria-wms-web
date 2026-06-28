import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  buildPedidoProveedorN8nPayload,
  formatPedidoProveedorValidationError,
  parsePedidoProveedorBody,
} from "@/lib/pedido-proveedor/pedido-proveedor.schema";

export interface PedidoProveedorRouteResponse {
  ok: boolean;
  n8nStatus?: number;
  correlationId?: string;
  error?: string;
}

function getPedidoProveedorEnv(): {
  webhookUrl: string | null;
  documentId: string | null;
} {
  return {
    webhookUrl: process.env.PEDIDO_PROVEEDOR_WEBHOOK_URL?.trim() ?? null,
    documentId: process.env.PEDIDO_PROVEEDOR_DOCUMENT_ID?.trim() ?? null,
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  const { webhookUrl, documentId } = getPedidoProveedorEnv();

  if (!webhookUrl || !documentId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Integración de pedido a proveedor no configurada.",
      } satisfies PedidoProveedorRouteResponse,
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Body JSON inválido.",
      } satisfies PedidoProveedorRouteResponse,
      { status: 400 },
    );
  }

  const parsed = parsePedidoProveedorBody(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: formatPedidoProveedorValidationError(parsed.error),
      } satisfies PedidoProveedorRouteResponse,
      { status: 400 },
    );
  }

  const correlationId = randomUUID();
  const payload = buildPedidoProveedorN8nPayload(
    parsed.data,
    documentId,
    correlationId,
    new Date().toISOString(),
  );

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result: PedidoProveedorRouteResponse = {
      ok: response.ok,
      n8nStatus: response.status,
      correlationId,
    };

    return NextResponse.json(result, {
      status: response.ok ? 200 : 502,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        n8nStatus: 0,
        correlationId,
        error: "No se pudo contactar el webhook de n8n.",
      } satisfies PedidoProveedorRouteResponse,
      { status: 502 },
    );
  }
}

export function GET(): NextResponse {
  return NextResponse.json(
    { ok: false, error: "Method not allowed." } satisfies PedidoProveedorRouteResponse,
    { status: 405 },
  );
}
