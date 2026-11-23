import { NextResponse } from "next/server";
import { listProductoCatalogoClavesServer } from "@/modules/sales/shared/services/sales-catalog.server";
import { mergeCorreoChromeIntoTexto } from "@/modules/sales/ordenes/utils/origen/correo-chrome";
import { leerPedidoEnMateoIa } from "@/lib/mateo-ia/mateo-ia.client";
import {
  buildLeerPedidoCacheKey,
  getLeerPedidoCache,
  setLeerPedidoCache,
} from "@/lib/mateo-ia/leer-pedido-cache";

const PRESENTACIONES = [
  "",
  "Caja 1.5 kg",
  "Caja 20 kg",
  "Caja 21 kg",
  "Granel",
] as const;

const MAX_FILES = 8;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

/**
 * BFF: resuelve catálogo de la cuenta y delega la lectura IA a mateo-ia-api.
 * Excluido del rewrite a Nest en next.config.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
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
    // Catálogo y base64 de archivos son independientes: en paralelo.
    const [catalogoClaves, archivosB64] = await Promise.all([
      listProductoCatalogoClavesServer(codigoCuenta),
      Promise.all(
        archivos.map(async (file) => ({
          nombre: file.name,
          mime: file.type || "application/octet-stream",
          base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
        })),
      ),
    ]);

    if (catalogoClaves.length === 0) {
      return NextResponse.json(
        {
          error:
            "No hay productos en el catálogo de esta cuenta. Revisa el esquema/tenant o el alta de productos.",
        },
        { status: 422 },
      );
    }

    const cacheKey = buildLeerPedidoCacheKey({
      codigoCuenta,
      texto,
      archivos: archivosB64.map((a) => ({
        nombre: a.nombre,
        size: a.base64.length,
        base64Head: a.base64.slice(0, 64),
      })),
    });
    const cached = getLeerPedidoCache(cacheKey);
    if (cached && typeof cached === "object") {
      console.log(
        JSON.stringify({
          evento: "leer-pedido",
          exito: true,
          via: "cache",
          codigoCuenta,
          duracionMs: Date.now() - inicio,
        }),
      );
      return NextResponse.json(cached);
    }

    const lectura = await leerPedidoEnMateoIa({
      texto: texto || undefined,
      archivos: archivosB64,
      catalogoClaves,
      presentaciones: [...PRESENTACIONES],
      hoyISO: new Date().toISOString().slice(0, 10),
    });

    const pedido = lectura.pedido as {
      textoOrigen?: string | null;
      [clave: string]: unknown;
    };
    const textoOrigen = mergeCorreoChromeIntoTexto(
      lectura.textoOrigen || texto,
      pedido.textoOrigen?.trim() || lectura.textoOrigen || texto,
    );

    const payload = {
      ...pedido,
      textoOrigen: textoOrigen || null,
      grupos: lectura.grupos,
      documentos: lectura.documentos,
      advertencias: lectura.advertencias,
    };
    setLeerPedidoCache(cacheKey, payload);

    console.log(
      JSON.stringify({
        evento: "leer-pedido",
        exito: true,
        via: "mateo-ia-api",
        cliente: cliente || "(sin cliente)",
        codigoCuenta,
        catalogoProductos: catalogoClaves.length,
        archivos: archivos.length,
        textoOrigenChars: textoOrigen.length,
        duracionMs: Date.now() - inicio,
        tokensTotal: lectura.tokensTotal,
        costoUSD: lectura.costoUSD,
      }),
    );

    return NextResponse.json(payload);
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    console.log(
      JSON.stringify({
        evento: "leer-pedido",
        exito: false,
        via: "mateo-ia-api",
        codigoCuenta,
        error: mensaje,
        duracionMs: Date.now() - inicio,
      }),
    );
    const status = /Falta MATEO_IA|No se pudo contactar|503/.test(mensaje)
      ? 503
      : 500;
    return NextResponse.json({ error: mensaje }, { status });
  }
}
