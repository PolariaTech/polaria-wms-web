import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const OV_ADJUNTOS_BUCKET = "ov-adjuntos";
const MAX_BYTES = 15 * 1024 * 1024;

function sanitizeCuentaFolder(codigoCuenta: string): string {
  const raw = codigoCuenta.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return raw.slice(0, 64) || "sin-cuenta";
}

function sanitizeFileName(name: string): string {
  const base = name.trim().replace(/[/\\?%*:|"<>]/g, "_") || "adjunto";
  return base.slice(0, 120);
}

let bucketReady: Promise<boolean> | null = null;

async function ensureOvAdjuntosBucket(): Promise<boolean> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const admin = getSupabaseAdminClient();
      if (!admin) return false;
      const { data: buckets, error: listError } = await admin.storage.listBuckets();
      if (listError) {
        console.error("[ov-adjuntos] listBuckets:", listError.message);
        return false;
      }
      const exists = (buckets ?? []).some((b) => b.name === OV_ADJUNTOS_BUCKET);
      if (exists) return true;
      const { error: createError } = await admin.storage.createBucket(
        OV_ADJUNTOS_BUCKET,
        {
          public: false,
          fileSizeLimit: MAX_BYTES,
        },
      );
      if (createError && !/already exists/i.test(createError.message)) {
        console.error("[ov-adjuntos] createBucket:", createError.message);
        return false;
      }
      return true;
    })();
  }
  return bucketReady;
}

export type OvAdjuntoUploadOk = {
  ok: true;
  nombre: string;
  url: string;
  path: string;
  mime: string;
  bytes: number;
  resourceType: "storage";
};

/**
 * Sube adjunto de OV a Supabase Storage (bucket privado, path por cuenta).
 * Evita el bloqueo de PDF de Cloudinary (deny/ACL).
 */
export async function uploadOvAdjunto(
  file: File,
  codigoCuenta: string,
): Promise<OvAdjuntoUploadOk | { ok: false; status: number; message: string }> {
  if (file.size > MAX_BYTES) {
    return { ok: false, status: 400, message: "El archivo supera 15 MB." };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      status: 503,
      message:
        "Falta SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL para adjuntos.",
    };
  }

  const ready = await ensureOvAdjuntosBucket();
  if (!ready) {
    return {
      ok: false,
      status: 503,
      message:
        "No se pudo preparar el bucket ov-adjuntos en Supabase Storage.",
    };
  }

  const mime = (file.type || "application/octet-stream").toLowerCase();
  const nombre = file.name.trim() || "adjunto";
  const path = `${sanitizeCuentaFolder(codigoCuenta)}/${randomUUID()}-${sanitizeFileName(nombre)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(OV_ADJUNTOS_BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });

  if (error) {
    return {
      ok: false,
      status: 500,
      message: error.message || "Error al subir el adjunto a Supabase Storage.",
    };
  }

  // URL interna de entrega (proxy Next); no exponer signed URL de larga vida.
  const url = `/api/ov-adjuntos/file?path=${encodeURIComponent(path)}&nombre=${encodeURIComponent(nombre)}`;

  return {
    ok: true,
    nombre,
    url,
    path,
    mime,
    bytes: file.size,
    resourceType: "storage",
  };
}
