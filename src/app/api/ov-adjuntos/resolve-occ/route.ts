import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OV_ADJUNTOS_BUCKET } from "@/lib/supabase/upload-ov-adjunto";
import { extractFiles } from "@/modules/sales/ordenes/ai/file-extractors";
import {
  detectOrdenCompraFromSource,
  isGarbageOcValue,
} from "@/modules/sales/ordenes/utils/normalize-numero-pedido";

export const runtime = "nodejs";

function departamentoFromText(text: string): string {
  // Solo misma línea (no cruzar a "Solicita:" en PDFs unpdf desordenados).
  const labeled = text.match(/Departamento[ \t]*:[ \t]*([^\n\r]+)/i);
  const labeledVal = labeled?.[1]?.trim() || "";
  if (
    labeledVal &&
    !/^(solicita|autoriza|comentario|fecha|sub\s*almacen)/i.test(labeledVal)
  ) {
    return labeledVal;
  }
  // unpdf XPU HA: el código de centro (CBEEFB, CMIST, COMEDO) va tras Fecha de Entrega.
  const afterEntrega = text.match(
    /Fecha\s+de\s+Entrega\s*:\s*\d{4}[/\-.]\d{2}[/\-.]\d{2}\s*[\r\n\s]*([A-Z]{4,8})\b/i,
  );
  return afterEntrega?.[1]?.trim() || "";
}

/**
 * Recupera OCC / REQUISICION # desde un .eml o PDF en ov-adjuntos
 * (para OVs que ya guardaron basura tipo rAutorizado).
 * Query: path=cuenta/uuid-correo.eml
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const path = String(searchParams.get("path") ?? "").trim();

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
          "No se encontró el archivo en storage.",
      },
      { status: 404 },
    );
  }

  try {
    const buffer = Buffer.from(await data.arrayBuffer());
    const baseName = path.split("/").pop() || "adjunto";
    const mime = /\.eml$/i.test(baseName)
      ? "message/rfc822"
      : /\.pdf$/i.test(baseName)
        ? "application/pdf"
        : "application/octet-stream";

    const extracted = await extractFiles([
      { originalname: baseName, mimetype: mime, buffer },
    ]);

    const byAlmacen: Record<string, string> = {};
    const occs: string[] = [];
    const chunks: string[] = [];

    for (const file of extracted) {
      if (file.tipo !== "texto" || !file.contenido?.trim()) continue;
      chunks.push(file.contenido);
      const occ = detectOrdenCompraFromSource(file.contenido, [file.nombre]);
      if (!occ || isGarbageOcValue(occ)) continue;
      occs.push(occ);
      const dep = departamentoFromText(file.contenido);
      if (dep) byAlmacen[dep] = occ;
    }

    const occ =
      detectOrdenCompraFromSource(chunks.join("\n\n"), [baseName]) ||
      occs[0] ||
      null;

    return NextResponse.json({
      occ: occ && !isGarbageOcValue(occ) ? occ : null,
      byAlmacen,
      occs: [...new Set(occs)],
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo leer el adjunto para OCC.",
      },
      { status: 422 },
    );
  }
}
