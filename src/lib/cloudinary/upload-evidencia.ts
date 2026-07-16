import { createHash } from "node:crypto";

const MAX_BYTES = 10 * 1024 * 1024;

function trimEnv(value: string | undefined): string {
  if (value == null) return "";
  let s = String(value).replace(/^\uFEFF/, "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function readCloudinaryCredentials():
  | { ok: true; cloudName: string; apiKey: string; apiSecret: string }
  | { ok: false; message: string } {
  const rawUrl = trimEnv(process.env.CLOUDINARY_URL);
  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      if (u.protocol !== "cloudinary:") {
        return {
          ok: false,
          message: "CLOUDINARY_URL debe empezar con cloudinary://",
        };
      }
      const cloudName = u.hostname.trim();
      const apiKey = decodeURIComponent(u.username).trim();
      const apiSecret = decodeURIComponent(u.password ?? "").trim();
      if (!cloudName || !apiKey || !apiSecret) {
        return {
          ok: false,
          message: "CLOUDINARY_URL incompleto (cloud, key o secret vacío).",
        };
      }
      return { ok: true, cloudName, apiKey, apiSecret };
    } catch {
      return { ok: false, message: "CLOUDINARY_URL no es una URL válida." };
    }
  }

  const cloudName = trimEnv(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = trimEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = trimEnv(process.env.CLOUDINARY_API_SECRET);
  if (!cloudName || !apiKey || !apiSecret) {
    return {
      ok: false,
      message:
        "Configurá Cloudinary: CLOUDINARY_URL o CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET.",
    };
  }
  return { ok: true, cloudName, apiKey, apiSecret };
}

function signParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

export async function uploadEvidenciaImage(file: File): Promise<
  | { ok: true; url: string }
  | { ok: false; status: number; message: string }
> {
  if (file.size > MAX_BYTES) {
    return { ok: false, status: 400, message: "La imagen supera 10 MB." };
  }

  const type = (file.type ?? "").toLowerCase();
  if (!type.startsWith("image/")) {
    return {
      ok: false,
      status: 400,
      message: "Solo se permiten imágenes (JPEG, PNG, WebP, etc.).",
    };
  }

  const creds = readCloudinaryCredentials();
  if (!creds.ok) {
    return { ok: false, status: 503, message: creds.message };
  }

  const folder =
    trimEnv(process.env.CLOUDINARY_EVIDENCIA_FOLDER) ||
    "bodega-venta-evidencias";
  const timestamp = Math.round(Date.now() / 1000);
  const signature = signParams({ folder, timestamp }, creds.apiSecret);

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${type};base64,${buffer.toString("base64")}`;

  const body = new FormData();
  body.append("file", dataUri);
  body.append("api_key", creds.apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${creds.cloudName}/image/upload`,
      { method: "POST", body },
    );
    const payload = (await response.json()) as {
      secure_url?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      let message =
        payload.error?.message?.trim() ||
        "Error al subir la evidencia a Cloudinary.";
      if (/invalid signature/i.test(message)) {
        message =
          "Cloudinary: firma inválida. Revisá CLOUDINARY_URL en .env.local y reiniciá Next.";
      }
      return { ok: false, status: 500, message };
    }

    const url = String(payload.secure_url ?? "").trim();
    if (!url) {
      return {
        ok: false,
        status: 500,
        message: "Cloudinary no devolvió URL.",
      };
    }

    return { ok: true, url };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo conectar con Cloudinary.";
    return { ok: false, status: 500, message };
  }
}
