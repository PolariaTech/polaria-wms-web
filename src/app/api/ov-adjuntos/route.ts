import { NextResponse } from "next/server";
import { uploadOvAdjunto } from "@/lib/supabase/upload-ov-adjunto";

export const runtime = "nodejs";

/**
 * Sube adjuntos de origen de OV a Supabase Storage (carpeta por cuenta).
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

  const result = await uploadOvAdjunto(file, codigoCuenta);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json({
    nombre: result.nombre,
    url: result.url,
    path: result.path,
    mime: result.mime,
    bytes: result.bytes,
    resourceType: result.resourceType,
  });
}
