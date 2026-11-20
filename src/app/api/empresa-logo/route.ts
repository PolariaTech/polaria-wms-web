import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "empresa-logos";
const RUTA_LOGO = /^[A-Za-z0-9]+\/logo\.(jpg|jpeg|png)$/;

function tipoLogo(path: string): string {
  return path.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
}

export async function GET(request: Request): Promise<NextResponse> {
  const path = new URL(request.url).searchParams.get("path")?.trim() ?? "";
  if (!RUTA_LOGO.test(path)) {
    return NextResponse.json({ error: "Ruta de logo inválida." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Storage no configurado." }, { status: 503 });
  }

  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) {
    return NextResponse.json({ error: "No se encontró el logo." }, { status: 404 });
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": tipoLogo(path),
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
