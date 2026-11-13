import { describe, expect, it } from "vitest";
import {
  buildEmlInlineHtml,
  EML_INLINE_TABLE_CSS,
  sanitizeEmailCss,
  splitEmailHtmlStyles,
} from "./eml-inline-html";

function buildMimeWithHtmlTable(): Buffer {
  const boundary = "BOUNDHTML";
  const htmlPart = [
    "<html><head><style>td{color:#063;}</style></head><body>",
    "<table border=\"1\"><tr><th>SKU</th><th>Cant</th></tr>",
    "<tr><td>AGU-01</td><td>10</td></tr>",
    "</table>",
    "<script>alert(1)</script>",
    "</body></html>",
  ].join("");
  const mime = [
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "MIME-Version: 1.0",
    "Subject: OC con tabla",
    "From: cocina@hotel.com",
    "To: pedidos@polaria.co",
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    "SKU Cant",
    "AGU-01 10",
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    htmlPart,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return Buffer.from(mime, "utf8");
}

describe("sanitizeEmailCss", () => {
  it("bloquea @import y url externas", () => {
    expect(
      sanitizeEmailCss("@import url('https://evil'); td{color:red; background:url(https://x);}"),
    ).toContain("none");
    expect(
      sanitizeEmailCss("@import url('https://evil'); td{color:red;}"),
    ).not.toMatch(/@import/i);
  });
});

describe("splitEmailHtmlStyles", () => {
  it("extrae style y quita scripts", () => {
    const { styles, bodyHtml } = splitEmailHtmlStyles(
      "<style>td{color:green}</style><p>hola</p><script>x()</script>",
    );
    expect(styles).toContain("td{color:green}");
    expect(bodyHtml).toContain("<p>hola</p>");
    expect(bodyHtml).not.toContain("script");
  });
});

describe("buildEmlInlineHtml (REQ-132)", () => {
  it("conserva la tabla y aplica CSS de forma", async () => {
    const html = await buildEmlInlineHtml(buildMimeWithHtmlTable());
    expect(html).toContain("<table");
    expect(html).toContain("AGU-01");
    expect(html).toContain("border-collapse");
    expect(html).toContain(EML_INLINE_TABLE_CSS.slice(0, 40));
    expect(html).toContain("td{color:#063;}");
    expect(html).not.toContain("<script");
  });
});
