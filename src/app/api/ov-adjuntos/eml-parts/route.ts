import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OV_ADJUNTOS_BUCKET } from "@/lib/supabase/upload-ov-adjunto";
import { listEmlAttachmentParts } from "@/modules/sales/ordenes/utils/eml-attachments";

export const runtime = "nodejs";

/**
 * Lista adjuntos reales dentro de un .eml guardado en ov-adjuntos.
 * Query: path (storage path del .eml)
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const path = String(searchParams.get("path") ?? "").trim();

  if (!path || path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ error: "path inválido." }, { status: 400 });
  }

  if (!/\.eml$/i.test(path) && !path.toLowerCase().includes(".eml")) {
    // path suele ser cuenta/uuid-correo.eml
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Storage no configurado." },
      { status: 503 },
    );
  }

  const { data, error } = await admin.storage
    .from(OV_ADJUNTOS_BUCKET)
    .download(path);

  if (error || !data) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "No se encontró el .eml (¿fue subido a Supabase Storage?).",
      },
      { status: 404 },
    );
  }

  try {
    const buffer = Buffer.from(await data.arrayBuffer());
    const parts = await listEmlAttachmentParts(buffer);
    return NextResponse.json({ parts });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo leer el correo .eml.",
      },
      { status: 422 },
    );
  }
}
