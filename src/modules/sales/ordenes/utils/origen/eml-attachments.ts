import { simpleParser } from "mailparser";
import {
  formatMailAddress,
  type CorreoChrome,
} from "@/modules/sales/ordenes/utils/origen/correo-chrome";

export type EmlAttachmentPart = {
  index: number;
  nombre: string;
  mime: string;
  bytes: number;
};

export type EmlParsedMeta = CorreoChrome & {
  parts: EmlAttachmentPart[];
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
 * Lista adjuntos reales dentro de un .eml (ignora logos inline de firma)
 * y cabeceras From/To/Subject para Cypher.
 */
export async function listEmlAttachmentParts(
  buffer: Buffer,
): Promise<EmlAttachmentPart[]> {
  const { parts } = await parseEmlMeta(buffer);
  return parts;
}

export async function parseEmlMeta(buffer: Buffer): Promise<EmlParsedMeta> {
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

  return {
    from: formatMailAddress(parsed.from),
    to: formatMailAddress(parsed.to),
    subject: formatMailAddress(parsed.subject),
    parts,
  };
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

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * REQ-159: HTML legible del .eml para abrir en pestaña (inline).
 * Preferir cuerpo HTML del correo; si no, texto plano. Sin scripts.
 */
export async function buildEmlInlineHtml(buffer: Buffer): Promise<string> {
  const parsed = await simpleParser(buffer);
  const subject = String(parsed.subject ?? "").trim() || "(sin asunto)";
  const from = formatMailAddress(parsed.from) || "—";
  const to = formatMailAddress(parsed.to) || "—";
  const htmlBody = typeof parsed.html === "string" ? parsed.html.trim() : "";
  const textBody =
    typeof parsed.text === "string" ? parsed.text.trim() : "";

  const bodyInner = htmlBody
    ? htmlBody
    : textBody
      ? `<pre>${escapeHtmlText(textBody)}</pre>`
      : "<p><em>Este correo no trae cuerpo legible.</em></p>";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https: http:; style-src 'unsafe-inline'; font-src data:;" />
  <title>${escapeHtmlText(subject)}</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      padding: 1.25rem 1.5rem 2rem;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.5;
      color: #111;
      background: #fff;
    }
    header {
      max-width: 52rem;
      margin: 0 auto 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e5e5e5;
    }
    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 700;
    }
    .meta { color: #444; font-size: 0.875rem; }
    .meta div { margin: 0.15rem 0; }
    .body {
      max-width: 52rem;
      margin: 0 auto;
      overflow-wrap: anywhere;
    }
    .body pre {
      white-space: pre-wrap;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.875rem;
    }
    .body img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtmlText(subject)}</h1>
    <div class="meta">
      <div><strong>De:</strong> ${escapeHtmlText(from)}</div>
      <div><strong>Para:</strong> ${escapeHtmlText(to)}</div>
    </div>
  </header>
  <div class="body">${bodyInner}</div>
</body>
</html>`;
}
