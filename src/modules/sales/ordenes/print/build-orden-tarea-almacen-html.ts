import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

const MIN_PRODUCT_ROWS_PER_COL = 25;

const COMB2 = '<span class="comb"><i></i><i></i></span>';
const COMB3 = '<span class="comb"><i></i><i></i><i></i></span>';

const QR_SVG = `<svg viewBox="0 0 29 29" shape-rendering="crispEdges"><rect width="29" height="29" fill="#fff"/><g fill="#000"><rect x="0" y="0" width="7" height="7"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3"/><rect x="22" y="0" width="7" height="7"/><rect x="23" y="1" width="5" height="5" fill="#fff"/><rect x="24" y="2" width="3" height="3"/><rect x="0" y="22" width="7" height="7"/><rect x="1" y="23" width="5" height="5" fill="#fff"/><rect x="2" y="24" width="3" height="3"/><rect x="9" y="0" width="1" height="1"/><rect x="11" y="0" width="1" height="1"/><rect x="13" y="0" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/><rect x="12" y="2" width="1" height="1"/><rect x="10" y="4" width="1" height="1"/><rect x="13" y="4" width="1" height="1"/><rect x="8" y="6" width="1" height="1"/><rect x="11" y="6" width="1" height="1"/><rect x="0" y="9" width="1" height="1"/><rect x="2" y="9" width="1" height="1"/><rect x="4" y="9" width="1" height="1"/><rect x="6" y="11" width="1" height="1"/><rect x="3" y="11" width="1" height="1"/><rect x="1" y="13" width="1" height="1"/><rect x="5" y="13" width="1" height="1"/><rect x="9" y="9" width="2" height="2"/><rect x="13" y="9" width="2" height="2"/><rect x="17" y="9" width="2" height="2"/><rect x="11" y="12" width="2" height="2"/><rect x="15" y="12" width="2" height="2"/><rect x="19" y="12" width="2" height="2"/><rect x="9" y="15" width="2" height="2"/><rect x="13" y="15" width="2" height="2"/><rect x="17" y="15" width="2" height="2"/><rect x="11" y="18" width="2" height="2"/><rect x="15" y="18" width="2" height="2"/><rect x="22" y="9" width="1" height="1"/><rect x="25" y="10" width="1" height="1"/><rect x="27" y="12" width="1" height="1"/><rect x="23" y="14" width="1" height="1"/><rect x="26" y="16" width="1" height="1"/><rect x="22" y="18" width="1" height="1"/><rect x="9" y="22" width="1" height="1"/><rect x="12" y="23" width="1" height="1"/><rect x="15" y="22" width="1" height="1"/><rect x="18" y="24" width="1" height="1"/><rect x="21" y="22" width="1" height="1"/><rect x="24" y="23" width="1" height="1"/><rect x="27" y="26" width="1" height="1"/><rect x="10" y="26" width="1" height="1"/><rect x="14" y="27" width="1" height="1"/><rect x="19" y="27" width="1" height="1"/><rect x="23" y="27" width="1" height="1"/></g></svg>`;

const SHEET_CSS = `
  @page{ size:216mm 330mm; margin:8mm; }
  *{box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact;}
  html,body{margin:0;padding:0;background:#fff;}
  body{font-family:'IBM Plex Sans','Segoe UI',sans-serif;color:#000;}
  .mono{font-family:'IBM Plex Mono','Consolas',monospace;}
  .sheet{
    width:216mm;min-height:330mm;margin:0;background:#fff;padding:8mm;
    display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;
  }
  .page-meta{font-size:9.5px;color:#555;margin:0 0 6px;line-height:1.3;}
  table.hdr{width:100%;border-collapse:separate;border-spacing:0;margin:0;}
  table.hdr td{border:0;padding:0;vertical-align:top;}
  table.hdr td.fields{padding-right:6px;}
  table.hdr td.qr{width:90px;text-align:center;vertical-align:top;}
  table.hdr-grid{width:100%;border-collapse:collapse;table-layout:fixed;}
  table.hdr-grid col{width:33.333%;}
  table.hdr-grid td{border:1.2px solid #000;padding:4px 6px 5px;vertical-align:top;height:40px;overflow:hidden;}
  table.hdr-grid td.hi{border-width:2px;}
  table.hdr-grid td.ov{border-width:2px;}
  table.hdr-grid td.addr{height:44px;}
  table.hdr-grid td.split{padding:0;}
  table.hdr-grid td.split .split-row{display:table;width:100%;height:100%;table-layout:fixed;}
  table.hdr-grid td.split .split-half{display:table-cell;width:50%;padding:4px 6px 5px;vertical-align:top;}
  table.hdr-grid td.split .split-half + .split-half{border-left:1.2px solid #000;}
  table.hdr-grid label{display:block;font-size:10px;line-height:1.2;margin:0 0 3px;font-weight:500;}
  table.hdr-grid .v{font-size:11px;line-height:1.25;word-wrap:break-word;overflow-wrap:anywhere;overflow:hidden;max-height:3.4em;}
  .qrbox{width:82px;height:82px;border:2px solid #000;padding:3px;margin:0 auto;}
  .qrbox svg{width:100%;height:100%;display:block;}
  .qrcap{font-size:9.6px;margin-top:3px;text-align:center;font-weight:600;line-height:1.25;}
  .notes-block{margin:6px 0 4px;font-size:11px;}
  .notes-block .nlbl{font-weight:700;margin:0 0 8px;font-size:11px;line-height:1.2;}
  .notes-block .nline{border-bottom:1px solid #000;height:14px;margin:0 0 2px;}
  .notes-block.incidencias .nline{height:22px;margin:0 0 7px;}
  .notes-block .nval{font-size:10.5px;line-height:1.2;min-height:1.2em;}
  .comb{display:inline-block;vertical-align:middle;font-size:0;}
  .comb i{display:inline-block;width:13px;height:17px;border:1px solid #555;margin:0;}
  table.sec{width:100%;border-collapse:separate;border-spacing:0;margin:10px 0 0;}
  table.sec td{border:0;padding:0 0 3px;vertical-align:bottom;}
  table.sec td.h{font-size:11px;font-weight:700;}
  table.sec td.hint{font-size:9.5px;font-weight:400;text-align:right;}
  .sec-rule{height:2px;background:#000;margin:0 0 4px;}
  table.pt{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;}
  table.pt th, table.pt td{
    border-right:1px solid #000;border-bottom:1px solid #000;
    padding:2px 3px;word-wrap:break-word;overflow-wrap:anywhere;white-space:normal;
  }
  table.pt th:first-child, table.pt td:first-child{border-left:1px solid #000;}
  table.pt thead tr:first-child th{border-top:1px solid #000;}
  table.pt th{font-size:7px;font-weight:600;text-align:left;line-height:1.1;vertical-align:bottom;background:#fff;}
  table.pt th.c{text-align:center;}
  table.pt td{font-size:9.5px;line-height:1.15;vertical-align:middle;background:#fff;}
  table.pt tbody tr:nth-child(even) td{background:#e8e8e8;}
  table.pt td.n{font-size:9px;text-align:center;width:18px;}
  table.pt td.prod{font-size:9px;line-height:1.15;}
  table.pt td.spec{font-size:9px;}
  table.pt td.cc{text-align:center;}
  table.pt td.tick{text-align:center;}
  table.pt tbody tr{height:18px;}
  .tk{width:12px;height:12px;border:1.6px solid #000;display:inline-block;}
  table.products-wrap{width:100%;border-collapse:separate;border-spacing:4px 0;table-layout:fixed;margin:0;}
  table.products-wrap > tbody > tr > td{border:0;padding:0;vertical-align:top;width:50%;}
  table.signs{width:100%;border-collapse:separate;border-spacing:8px;table-layout:fixed;margin-top:2px;}
  table.signs td.sig{border:1.2px solid #000;padding:4px 6px;vertical-align:top;}
  .sig .role{font-size:10.5px;font-weight:700;}
  .sig .cap{font-size:9.5px;margin-top:18px;}
  @media print{
    html,body{margin:0;background:#fff;}
    .sheet{box-shadow:none;margin:0;width:auto;min-height:0;padding:0;page-break-inside:avoid;}
  }
`;

export function escapeOrdenTareaHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fieldValue(value: string): string {
  return escapeOrdenTareaHtml(value);
}

function sectionTitle(title: string, hint = ""): string {
  return (
    `<table class="sec"><tr>` +
    `<td class="h">${title}</td>` +
    (hint ? `<td class="hint">${hint}</td>` : `<td></td>`) +
    `</tr></table><div class="sec-rule"></div>`
  );
}

function buildProductRows(
  data: OrdenTareaAlmacenPrintData,
  startIndex: number,
  rowCount: number,
): string {
  const rows: string[] = [];

  for (let offset = 0; offset < rowCount; offset += 1) {
    const index = startIndex + offset;
    const linea = data.lineas[index];
    const cantidad = linea?.cantidadSolicitada
      ? fieldValue(linea.cantidadSolicitada)
      : COMB3;
    rows.push(
      `<tr><td class="n">${(data.lineaInicio ?? 1) + index}</td>` +
        `<td class="prod">${linea ? fieldValue(linea.producto) : ""}</td>` +
        `<td class="spec">${linea ? fieldValue(linea.especificacion) : ""}</td>` +
        `<td class="cc">${cantidad}</td>` +
        `<td class="tick"><span class="tk"></span></td>` +
        `<td class="tick"><span class="tk"></span></td></tr>`,
    );
  }

  return rows.join("");
}

function buildProductTable(
  data: OrdenTareaAlmacenPrintData,
  startIndex: number,
  rowCount: number,
): string {
  return (
    `<table class="pt">` +
    `<colgroup>` +
    `<col style="width:18px"><col style="width:34%"><col style="width:24%">` +
    `<col style="width:16%"><col style="width:34px"><col style="width:34px">` +
    `</colgroup>` +
    `<thead><tr>` +
    `<th class="n">#</th><th>Producto</th><th>Especificación</th>` +
    `<th class="c">Cant. solicitada</th>` +
    `<th class="c">Alistó</th><th class="c">Revisó</th>` +
    `</tr></thead>` +
    `<tbody>${buildProductRows(data, startIndex, rowCount)}</tbody>` +
    `</table>`
  );
}

function buildNotesBlock(
  value = "",
  lineCount = 2,
  label = "",
  variant: "notas" | "incidencias" = "notas",
): string {
  const hasLabel = Boolean(label.trim());
  const contentStart = hasLabel ? 1 : 0;
  const lines: string[] = [];
  for (let index = 0; index < lineCount; index += 1) {
    const content =
      index === contentStart && value
        ? `<div class="nval">${fieldValue(value)}</div>`
        : "";
    lines.push(`<div class="nline">${content}</div>`);
  }
  const title = hasLabel
    ? `<div class="nlbl">${escapeOrdenTareaHtml(label)}</div>`
    : "";
  const cls =
    variant === "incidencias" ? "notes-block incidencias" : "notes-block";
  return `<div class="${cls}">${title}${lines.join("")}</div>`;
}

export function buildOrdenTareaAlmacenHtml(
  data: OrdenTareaAlmacenPrintData,
): string {
  const folio = fieldValue(data.folio);
  const title = `Orden de venta ${data.folio}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${escapeOrdenTareaHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
<style>${SHEET_CSS}</style>
</head>
<body>
<div class="sheet">
  <div class="page-meta mono">Creada ${fieldValue(data.creada)}  ·  Impresa ${fieldValue(data.impresa)}</div>
  <table class="hdr"><tr>
    <td class="fields">
      <table class="hdr-grid">
        <colgroup><col><col><col></colgroup>
        <tr>
          <td class="ov">
            <label>Orden de venta</label>
            <div class="v mono">${folio}</div>
          </td>
          <td>
            <label>Orden de trabajo</label>
            <div class="v">${fieldValue(data.ordenTrabajo || "1/1")}</div>
          </td>
          <td><label>Factura asociada</label><div class="v mono">_______________</div></td>
        </tr>
        <tr>
          <td class="ov" colspan="2">
            <label># de orden del cliente</label>
            <div class="v">${fieldValue(data.numeroOrdenCliente)}</div>
          </td>
          <td></td>
        </tr>
        <tr>
          <td class="hi"><label>Cliente</label><div class="v">${fieldValue(data.cliente)}</div></td>
          <td><label>Centro de consumo</label><div class="v">${fieldValue(data.centroConsumo)}</div></td>
          <td class="split">
            <div class="split-row">
              <div class="split-half">
                <label>Fecha de entrega</label>
                ${data.fechaEntrega ? `<div class="v">${fieldValue(data.fechaEntrega)}</div>` : COMB2 + COMB2 + COMB2}
              </div>
              <div class="split-half">
                <label>Hora de entrega</label>
                ${data.horaEntrega ? `<div class="v">${fieldValue(data.horaEntrega)}</div>` : COMB2 + COMB2}
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td class="addr" colspan="3"><label>Dirección de entrega</label><div class="v">${fieldValue(data.direccionEntrega)}</div></td>
        </tr>
      </table>
    </td>
    <td class="qr">
      <div class="qrbox">${QR_SVG}</div>
    </td>
  </tr></table>
  ${buildNotesBlock(data.notasGenerales, 3)}
  <table class="products-wrap"><tr>
    <td>${buildProductTable(data, 0, MIN_PRODUCT_ROWS_PER_COL)}</td>
    <td>${buildProductTable(data, MIN_PRODUCT_ROWS_PER_COL, MIN_PRODUCT_ROWS_PER_COL)}</td>
  </tr></table>
  <table class="sec"><tr><td></td></tr></table><div class="sec-rule"></div>
  <table class="signs"><tr>
    <td class="sig"><div class="role">Alistó</div></td>
    <td class="sig"><div class="role">Revisó</div></td>
    <td class="sig"><div class="role">Factura (OK)</div></td>
    <td class="sig"><div class="role">Despachó</div><div class="cap">Firma &nbsp;&nbsp;&nbsp; Fecha</div></td>
    <td class="sig"><div class="role">Retorno</div></td>
  </tr></table>
  ${buildNotesBlock("", 8, "Incidencias", "incidencias")}
</div>
</body>
</html>`;
}
