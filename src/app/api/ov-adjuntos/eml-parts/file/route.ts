import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OV_ADJUNTOS_BUCKET } from "@/lib/supabase/upload-ov-adjunto";
import { getEmlAttachmentBuffer } from "@/modules/sales/ordenes/utils/origen/eml-attachments";

export const runtime = "nodejs";

/**
 * Descarga un adjunto real embebido en un .eml de ov-adjuntos.
 * Query: path, index, disposition=inline|attachment
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const path = String(searchParams.get("path") ?? "").trim();
  const indexRaw = String(searchParams.get("index") ?? "").trim();
  const index = Number(indexRaw);
  const dispositionRaw = String(searchParams.get("disposition") ?? "attachment")
    .trim()
    .toLowerCase();
  const disposition =
    dispositionRaw === "inline" ? "inline" : "attachment";

  if (!path || path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ error: "path inválido." }, { status: 400 });
  }
  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "index inválido." }, { status: 400 });
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
    const part = await getEmlAttachmentBuffer(buffer, index);
    if (!part) {
      return NextResponse.json(
        { error: "Adjunto no encontrado en el correo." },
        { status: 404 },
      );
    }

    const safeName = part.nombre.replace(/[/\\"]/g, "_");
    return new NextResponse(new Uint8Array(part.content), {
      status: 200,
      headers: {
        "Content-Type": part.mime,
        "Content-Length": String(part.content.length),
        "Content-Disposition": `${disposition}; filename="${safeName}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo extraer el adjunto del .eml.",
      },
      { status: 422 },
    );
  }
}
