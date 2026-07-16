import { NextResponse } from "next/server";
import { uploadEvidenciaImage } from "@/lib/cloudinary/upload-evidencia";

export const runtime = "nodejs";

/**
 * Sube foto o firma de entrega (rol transportista) a Cloudinary.
 * Misma carpeta/credenciales que bodega-de-frio.
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

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Falta el archivo (campo «file»)." },
      { status: 400 },
    );
  }

  const result = await uploadEvidenciaImage(file);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json({ url: result.url });
}
