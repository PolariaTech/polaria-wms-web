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

function buildMimeWithOutlookStackedTable(): Buffer {
  const boundary = "BOUNDOUTLOOK";
  const htmlPart = [
    "<html><head><style>",
    "td{display:block !important; float:left; width:100%;}",
    "table{width:100%;}",
    "</style></head><body>",
    "<table><tr><th>Clave</th><th>Um</th><th>Pedido</th></tr>",
    "<tr><td>X200011700</td><td>KG</td><td>37</td></tr>",
    "</table>",
    "</body></html>",
  ].join("");
  const plainAplastado = [
    "Clave",
    "Um",
    "Pedido",
    "X200011700",
    "KG",
    "37",
  ].join("\n");
  const mime = [
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "MIME-Version: 1.0",
    "Subject: OC Outlook apilada",
    "From: cocina@hotel.com",
    "To: pedidos@polaria.co",
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    plainAplastado,
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

describe("buildEmlInlineHtml (REQ-132 + REQ-343)", () => {
  it("conserva la tabla y aplica CSS de forma", async () => {
    const html = await buildEmlInlineHtml(buildMimeWithHtmlTable());
    expect(html).toContain("<table");
    expect(html).toContain("AGU-01");
    expect(html).toContain("border-collapse");
    expect(html).toContain(EML_INLINE_TABLE_CSS.slice(0, 40));
    expect(html).toContain("td{color:#063;}");
    expect(html).not.toContain("<script");
  });

  it("CSS de tabla va después del CSS del mail y fuerza table-cell (general)", async () => {
    const html = await buildEmlInlineHtml(buildMimeWithOutlookStackedTable());
    expect(html).toContain("<table");
    expect(html).toContain("X200011700");
    expect(html).not.toMatch(/<pre>[\s\S]*X200011700/);
    const mailCssIdx = html.indexOf("td{display:block");
    const forceCssIdx = html.indexOf("display: table-cell !important");
    expect(mailCssIdx).toBeGreaterThan(-1);
    expect(forceCssIdx).toBeGreaterThan(mailCssIdx);
    expect(html).toContain("display: table !important");
  });
});
