import { NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
} from "@/lib/supabase/admin";
import { OV_ADJUNTOS_BUCKET } from "@/lib/supabase/upload-ov-adjunto";

export const runtime = "nodejs";

/**
 * Entrega un adjunto de OV desde Supabase Storage (inline o attachment).
 * Query: path, nombre?, disposition=inline|attachment
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const path = String(searchParams.get("path") ?? "").trim();
  const nombre = String(searchParams.get("nombre") ?? "").trim() || "adjunto";
  const dispositionRaw = String(searchParams.get("disposition") ?? "inline")
    .trim()
    .toLowerCase();
  const disposition =
    dispositionRaw === "attachment" ? "attachment" : "inline";

  if (!path || path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ error: "path inválido." }, { status: 400 });
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
          "No se encontró el archivo (¿fue subido a Supabase Storage?).",
      },
      { status: 404 },
    );
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const contentType = data.type || "application/octet-stream";
  const safeName = nombre.replace(/[/\\"]/g, "_");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
      "Content-Disposition": `${disposition}; filename="${safeName}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
