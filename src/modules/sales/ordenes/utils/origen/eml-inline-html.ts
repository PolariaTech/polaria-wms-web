import { simpleParser } from "mailparser";
import { formatMailAddress } from "@/modules/sales/ordenes/utils/origen/correo-chrome";

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Quita @import y url externas del CSS del correo (REQ-132). */
export function sanitizeEmailCss(css: string): string {
  return css
    .replace(/@import[^;]*;?/gi, "")
    .replace(/url\(\s*(?!['"]?data:)[^)]*\)/gi, "none");
}

/**
 * Extrae `<style>` del HTML del correo y limpia scripts.
 * Los estilos del cliente (Outlook/Gmail) suelen vivir ahí.
 */
export function splitEmailHtmlStyles(html: string): {
  styles: string;
  bodyHtml: string;
} {
  const styles: string[] = [];
  let bodyHtml = html.replace(
    /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
    (_match, css: string) => {
      const cleaned = sanitizeEmailCss(String(css ?? "").trim());
      if (cleaned) styles.push(cleaned);
      return "";
    },
  );
  bodyHtml = bodyHtml
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  return { styles: styles.join("\n"), bodyHtml: bodyHtml.trim() };
}

/** CSS base para que tablas de .eml se lean como tabla (REQ-132). */
export const EML_INLINE_TABLE_CSS = `
    .body table {
      border-collapse: collapse;
      width: 100%;
      max-width: 100%;
      margin: 0.75rem 0;
      font-size: 0.875rem;
      table-layout: auto;
    }
    .body th,
    .body td {
      border: 1px solid #c8c8c8;
      padding: 0.4rem 0.55rem;
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .body th {
      background: #f0f0f0;
      font-weight: 700;
    }
    .body tr:nth-child(even) td {
      background: #fafafa;
    }
    .body table[border="0"] th,
    .body table[border="0"] td {
      border-color: #ddd;
    }
`.trim();

/**
 * REQ-159 + REQ-132: HTML legible del .eml para vista inline.
 * Conserva estilos del correo y fuerza forma de tablas.
 */
export async function buildEmlInlineHtml(buffer: Buffer): Promise<string> {
  const parsed = await simpleParser(buffer);
  const subject = String(parsed.subject ?? "").trim() || "(sin asunto)";
  const from = formatMailAddress(parsed.from) || "—";
  const to = formatMailAddress(parsed.to) || "—";
  const rawHtml = typeof parsed.html === "string" ? parsed.html.trim() : "";
  const textBody =
    typeof parsed.text === "string" ? parsed.text.trim() : "";

  const { styles: emailStyles, bodyHtml } = rawHtml
    ? splitEmailHtmlStyles(rawHtml)
    : { styles: "", bodyHtml: "" };

  const bodyInner = bodyHtml
    ? bodyHtml
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
      max-width: 56rem;
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
      max-width: 56rem;
      margin: 0 auto;
      overflow-wrap: anywhere;
      overflow-x: auto;
    }
    .body pre {
      white-space: pre-wrap;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.875rem;
    }
    .body img { max-width: 100%; height: auto; }
    ${EML_INLINE_TABLE_CSS}
  </style>
  ${emailStyles ? `<style>\n${emailStyles}\n</style>` : ""}
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
