import type { OrigenAdjunto } from "../utils/origen-adjuntos";

/** Sube un File a Cloudinary vía Route Handler (carpeta por cuenta). */
export async function uploadOvAdjuntoClient(
  file: File,
  codigoCuenta: string,
): Promise<OrigenAdjunto> {
  const body = new FormData();
  body.append("file", file);
  body.append("codigoCuenta", codigoCuenta);

  const response = await fetch("/api/ov-adjuntos", {
    method: "POST",
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    nombre?: string;
    url?: string;
    path?: string;
    mime?: string;
    bytes?: number;
    resourceType?: OrigenAdjunto["resourceType"];
  };

  if (!response.ok) {
    throw new Error(
      payload.error?.trim() ||
        `No se pudo subir «${file.name}» (${response.status}).`,
    );
  }

  const nombre = payload.nombre?.trim() || file.name;
  const path = payload.path?.trim() || null;
  const url = payload.url?.trim() || null;
  if (!path && !url) {
    throw new Error(`Storage no devolvió path/URL para «${file.name}».`);
  }

  return {
    nombre,
    url,
    path,
    mime: payload.mime ?? file.type ?? null,
    bytes: payload.bytes ?? file.size,
    resourceType: payload.resourceType ?? "storage",
  };
}

export async function uploadOvAdjuntosClient(
  files: readonly File[],
  codigoCuenta: string,
): Promise<OrigenAdjunto[]> {
  const out: OrigenAdjunto[] = [];
  for (const file of files) {
    out.push(await uploadOvAdjuntoClient(file, codigoCuenta));
  }
  return out;
}
