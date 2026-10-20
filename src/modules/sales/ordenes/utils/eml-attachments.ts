import { simpleParser } from "mailparser";

export type EmlAttachmentPart = {
  index: number;
  nombre: string;
  mime: string;
  bytes: number;
};

const DOC_EXT =
  /\.(pdf|xlsx?|xls|csv|docx?|pptx?|zip|rar|7z|txt|html?)$/i;

function isLikelyRealAttachment(input: {
  contentDisposition?: string | null;
  filename?: string | null;
  contentType?: string | null;
}): boolean {
  const disposition = (input.contentDisposition ?? "").toLowerCase();
  const filename = (input.filename ?? "").trim();
  const mime = (input.contentType ?? "").toLowerCase();

  if (disposition === "attachment") {
    // Logos de firma a veces vienen como attachment sin nombre útil.
    if (!filename && mime.startsWith("image/")) return false;
    return true;
  }

  // Algunos clientes marcan PDFs/Excel como inline; si hay nombre de documento, incluir.
  if (filename && DOC_EXT.test(filename)) return true;

  return false;
}

/**
 * Lista adjuntos reales dentro de un .eml (ignora logos inline de firma).
 */
export async function listEmlAttachmentParts(
  buffer: Buffer,
): Promise<EmlAttachmentPart[]> {
  const parsed = await simpleParser(buffer);
  const parts: EmlAttachmentPart[] = [];

  parsed.attachments.forEach((adjunto, index) => {
    if (
      !isLikelyRealAttachment({
        contentDisposition: adjunto.contentDisposition,
        filename: adjunto.filename,
        contentType: adjunto.contentType,
      })
    ) {
      return;
    }

    const nombre =
      adjunto.filename?.trim() ||
      `adjunto-${parts.length + 1}${
        adjunto.contentType?.includes("pdf") ? ".pdf" : ""
      }`;
    const content = adjunto.content;
    const bytes = Buffer.isBuffer(content)
      ? content.length
      : Buffer.from(content).length;

    parts.push({
      index,
      nombre,
      mime: adjunto.contentType || "application/octet-stream",
      bytes,
    });
  });

  return parts;
}

/**
 * Devuelve el buffer de un adjunto del .eml por índice de `parsed.attachments`.
 */
export async function getEmlAttachmentBuffer(
  buffer: Buffer,
  attachmentIndex: number,
): Promise<{ nombre: string; mime: string; content: Buffer } | null> {
  const parsed = await simpleParser(buffer);
  const adjunto = parsed.attachments[attachmentIndex];
  if (!adjunto) return null;

  if (
    !isLikelyRealAttachment({
      contentDisposition: adjunto.contentDisposition,
      filename: adjunto.filename,
      contentType: adjunto.contentType,
    })
  ) {
    return null;
  }

  const content = Buffer.isBuffer(adjunto.content)
    ? adjunto.content
    : Buffer.from(adjunto.content);

  return {
    nombre:
      adjunto.filename?.trim() ||
      `adjunto-${attachmentIndex + 1}`,
    mime: adjunto.contentType || "application/octet-stream",
    content,
  };
}
