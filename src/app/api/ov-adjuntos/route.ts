import { NextResponse } from "next/server";
import { uploadOvAdjuntoWithEmlExpand } from "@/lib/supabase/upload-ov-adjunto";

export const runtime = "nodejs";

/**
 * Sube adjuntos de origen de OV a Supabase Storage (carpeta por cuenta).
 * Si el archivo es .eml, también extrae y sube PDF/Excel internos.
 * FormData: file, codigoCuenta.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de solicitud inválido." },
      { status: 400 },
    );
  }

  const codigoCuenta = String(formData.get("codigoCuenta") ?? "").trim();
  if (!codigoCuenta) {
    return NextResponse.json(
      { error: "Falta codigoCuenta." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Falta el archivo (campo «file»)." },
      { status: 400 },
    );
  }

  const result = await uploadOvAdjuntoWithEmlExpand(file, codigoCuenta);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }

  const primary = result.items[0]!;
  return NextResponse.json({
    nombre: primary.nombre,
    url: primary.url,
    path: primary.path,
    mime: primary.mime,
    bytes: primary.bytes,
    resourceType: primary.resourceType,
    /** Adjuntos reales extraídos del .eml (si aplica), incluido el propio .eml. */
    items: result.items.map((item) => ({
      nombre: item.nombre,
      url: item.url,
      path: item.path,
      mime: item.mime,
      bytes: item.bytes,
      resourceType: item.resourceType,
    })),
  });
}
