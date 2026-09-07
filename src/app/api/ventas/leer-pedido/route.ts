import { NextResponse } from "next/server";
import { extractFiles } from "@/modules/sales/ordenes/ai/file-extractors";
import {
  extraerPedido,
  type PedidoExtraido,
} from "@/modules/sales/ordenes/ai/openai-pedido.client";
import { listProductosVentaCatalogoServer } from "@/modules/sales/shared/services/sales-catalog.server";
import OpenAI from "openai";

const PRESENTACIONES = [
  "",
  "Caja 1.5 kg",
  "Caja 20 kg",
  "Caja 21 kg",
  "Granel",
] as const;

const MAX_FILES = 8;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

function catalogKey(nombre: string, codigo: string): string {
  return `${nombre} (${codigo})`;
}

export async function POST(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      {
        error:
          "Falta configurar OPENAI_API_KEY en el servidor para leer pedidos con IA.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el formulario multipart." },
      { status: 400 },
    );
  }

  const codigoCuenta = String(form.get("codigoCuenta") ?? "").trim();
  const cliente = String(form.get("cliente") ?? "").trim();
  const texto = String(form.get("texto") ?? "").trim();
  const archivos = form
    .getAll("archivos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!codigoCuenta) {
    return NextResponse.json({ error: "Falta codigoCuenta." }, { status: 400 });
  }
  if (!cliente) {
    return NextResponse.json({ error: "Falta indicar el cliente." }, { status: 400 });
  }
  if (!texto && archivos.length === 0) {
    return NextResponse.json(
      { error: "No hay texto ni archivos que leer." },
      { status: 400 },
    );
  }
  if (archivos.length > MAX_FILES) {
    return NextResponse.json(
      { error: "Puedes adjuntar máximo 8 archivos." },
      { status: 400 },
    );
  }
  if (archivos.some((file) => file.size > MAX_FILE_BYTES)) {
    return NextResponse.json(
      { error: "Uno de los archivos supera el límite de 15MB." },
      { status: 400 },
    );
  }

  const inicio = Date.now();

  try {
    const productos = await listProductosVentaCatalogoServer(codigoCuenta);
    const catalogoClaves = productos.map((p) =>
      catalogKey(p.nombre, p.codigo),
    );

    const uploaded = await Promise.all(
      archivos.map(async (file) => ({
        originalname: file.name,
        mimetype: file.type || "application/octet-stream",
        buffer: Buffer.from(await file.arrayBuffer()),
      })),
    );

    const archivosExtraidos = await extractFiles(uploaded);
    const hoyISO = new Date().toISOString().slice(0, 10);

    const { pedido, uso } = await extraerPedido({
      texto,
      archivosExtraidos,
      hoyISO,
      catalogoClaves,
      presentaciones: [...PRESENTACIONES],
    });

    console.log(
      JSON.stringify({
        evento: "leer-pedido",
        exito: true,
        cliente,
        codigoCuenta,
        archivos: archivos.length,
        duracionMs: Date.now() - inicio,
        tokensEntrada: uso?.tokensEntrada ?? null,
        tokensSalida: uso?.tokensSalida ?? null,
        tokensTotal: uso?.tokensTotal ?? null,
        costoUSD: uso?.costoUSD ?? null,
      }),
    );

    const response: PedidoExtraido = pedido;
    return NextResponse.json(response);
  } catch (err) {
    console.log(
      JSON.stringify({
        evento: "leer-pedido",
        exito: false,
        cliente,
        codigoCuenta,
        archivos: archivos.length,
        duracionMs: Date.now() - inicio,
      }),
    );
    console.error("Error en /api/ventas/leer-pedido:", err);

    if (err instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error:
            "El servicio de IA no está disponible en este momento. Intenta de nuevo.",
        },
        { status: 502 },
      );
    }

    const message =
      err instanceof Error && /OPENAI_API_KEY/i.test(err.message)
        ? err.message
        : "No se pudo leer el pedido. Intenta de nuevo.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
