import type { OrigenAdjunto } from "../utils/origen-adjuntos";

/** Sube un File vía Route Handler (carpeta por cuenta). Si es .eml, incluye PDF internos. */
export async function uploadOvAdjuntoClient(
  file: File,
  codigoCuenta: string,
): Promise<OrigenAdjunto[]> {
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
    items?: Array<{
      nombre?: string;
      url?: string;
      path?: string;
      mime?: string;
      bytes?: number;
      resourceType?: OrigenAdjunto["resourceType"];
    }>;
  };

  if (!response.ok) {
    throw new Error(
      payload.error?.trim() ||
        `No se pudo subir «${file.name}» (${response.status}).`,
    );
  }

  if (Array.isArray(payload.items) && payload.items.length > 0) {
    return payload.items.map((item) => {
      const nombre = item.nombre?.trim() || file.name;
      const path = item.path?.trim() || null;
      const url = item.url?.trim() || null;
      return {
        nombre,
        url,
        path,
        mime: item.mime ?? null,
        bytes: item.bytes ?? null,
        resourceType: item.resourceType ?? "storage",
      };
    });
  }

  const nombre = payload.nombre?.trim() || file.name;
  const path = payload.path?.trim() || null;
  const url = payload.url?.trim() || null;
  if (!path && !url) {
    throw new Error(`Storage no devolvió path/URL para «${file.name}».`);
  }

  return [
    {
      nombre,
      url,
      path,
      mime: payload.mime ?? file.type ?? null,
      bytes: payload.bytes ?? file.size,
      resourceType: payload.resourceType ?? "storage",
    },
  ];
}

export async function uploadOvAdjuntosClient(
  files: readonly File[],
  codigoCuenta: string,
): Promise<OrigenAdjunto[]> {
  const out: OrigenAdjunto[] = [];
  for (const file of files) {
    out.push(...(await uploadOvAdjuntoClient(file, codigoCuenta)));
  }
  return out;
}
