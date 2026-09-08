import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

const MIN_PRODUCT_ROWS = 10;

const COMB2 = '<span class="comb"><i></i><i></i></span>';
const COMB3 = '<span class="comb"><i></i><i></i><i></i></span>';

const QR_SVG = `<svg viewBox="0 0 29 29" shape-rendering="crispEdges"><rect width="29" height="29" fill="#fff"/><g fill="#000"><rect x="0" y="0" width="7" height="7"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3"/><rect x="22" y="0" width="7" height="7"/><rect x="23" y="1" width="5" height="5" fill="#fff"/><rect x="24" y="2" width="3" height="3"/><rect x="0" y="22" width="7" height="7"/><rect x="1" y="23" width="5" height="5" fill="#fff"/><rect x="2" y="24" width="3" height="3"/><rect x="9" y="0" width="1" height="1"/><rect x="11" y="0" width="1" height="1"/><rect x="13" y="0" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/><rect x="12" y="2" width="1" height="1"/><rect x="10" y="4" width="1" height="1"/><rect x="13" y="4" width="1" height="1"/><rect x="8" y="6" width="1" height="1"/><rect x="11" y="6" width="1" height="1"/><rect x="0" y="9" width="1" height="1"/><rect x="2" y="9" width="1" height="1"/><rect x="4" y="9" width="1" height="1"/><rect x="6" y="11" width="1" height="1"/><rect x="3" y="11" width="1" height="1"/><rect x="1" y="13" width="1" height="1"/><rect x="5" y="13" width="1" height="1"/><rect x="9" y="9" width="2" height="2"/><rect x="13" y="9" width="2" height="2"/><rect x="17" y="9" width="2" height="2"/><rect x="11" y="12" width="2" height="2"/><rect x="15" y="12" width="2" height="2"/><rect x="19" y="12" width="2" height="2"/><rect x="9" y="15" width="2" height="2"/><rect x="13" y="15" width="2" height="2"/><rect x="17" y="15" width="2" height="2"/><rect x="11" y="18" width="2" height="2"/><rect x="15" y="18" width="2" height="2"/><rect x="22" y="9" width="1" height="1"/><rect x="25" y="10" width="1" height="1"/><rect x="27" y="12" width="1" height="1"/><rect x="23" y="14" width="1" height="1"/><rect x="26" y="16" width="1" height="1"/><rect x="22" y="18" width="1" height="1"/><rect x="9" y="22" width="1" height="1"/><rect x="12" y="23" width="1" height="1"/><rect x="15" y="22" width="1" height="1"/><rect x="18" y="24" width="1" height="1"/><rect x="21" y="22" width="1" height="1"/><rect x="24" y="23" width="1" height="1"/><rect x="27" y="26" width="1" height="1"/><rect x="10" y="26" width="1" height="1"/><rect x="14" y="27" width="1" height="1"/><rect x="19" y="27" width="1" height="1"/><rect x="23" y="27" width="1" height="1"/></g></svg>`;

const SHEET_CSS = `
  @page{ size:216mm 330mm; margin:8mm; }
  *{box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact;}
  html,body{margin:0;padding:0;background:#fff;}
  body{font-family:'IBM Plex Sans','Segoe UI',sans-serif;color:#000;}
  .mono{font-family:'IBM Plex Mono','Consolas',monospace;}
  .sheet{width:216mm;min-height:330mm;margin:0;background:#fff;padding:8mm;}
  table.hdr{width:100%;border-collapse:separate;border-spacing:0;margin:0 0 6px;}
  table.hdr td{border:0;padding:0;vertical-align:top;}
  table.hdr td.qr{width:78px;text-align:center;}
  .hdr-rule{height:3px;background:#000;margin:0 0 8px;}
  .hdr h1{margin:0;font-size:19px;font-weight:700;letter-spacing:.3px;}
  .folio{font-size:11px;margin-top:5px;line-height:1.55;}
  .folio .big{font-size:17px;font-weight:700;letter-spacing:1px;}
  .qrbox{width:66px;height:66px;border:2px solid #000;padding:3px;margin:0 auto;}
  .qrbox svg{width:100%;height:100%;display:block;}
  .qrcap{font-size:9.6px;margin-top:2px;text-align:center;font-weight:600;line-height:1.25;}
  table.idgrid{width:100%;border-collapse:separate;border-spacing:6px;table-layout:fixed;}
  table.idgrid td{border:1.2px solid #000;padding:4px 6px 5px;vertical-align:top;height:42px;overflow:hidden;}
  table.idgrid td.hi{border-width:2px;}
  table.idgrid td.addr{height:56px;}
  table.idgrid label{display:block;font-size:10px;line-height:1.2;margin:0 0 3px;font-weight:500;}
  table.idgrid .v{font-size:11px;line-height:1.25;word-wrap:break-word;overflow-wrap:anywhere;overflow:hidden;max-height:3.4em;}
  .comb{display:inline-block;vertical-align:middle;font-size:0;}
  .comb i{display:inline-block;width:13px;height:17px;border:1px solid #555;margin:0;}
  .chk{width:13px;height:13px;border:1.6px solid #000;display:inline-block;vertical-align:middle;}
  .chk.lg{width:17px;height:17px;}
  table.sec{width:100%;border-collapse:separate;border-spacing:0;margin:10px 0 0;}
  table.sec td{border:0;padding:0 0 3px;vertical-align:bottom;}
  table.sec td.h{font-size:11px;font-weight:700;}
  table.sec td.hint{font-size:9.5px;font-weight:400;text-align:right;}
  .sec-rule{height:2px;background:#000;margin:0 0 4px;}
  table.pt{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;}
  table.pt th, table.pt td{
    border-right:1px solid #000;border-bottom:1px solid #000;
    padding:4px 5px;word-wrap:break-word;overflow-wrap:anywhere;white-space:normal;
  }
  table.pt th:first-child, table.pt td:first-child{border-left:1px solid #000;}
  table.pt thead tr:first-child th{border-top:1px solid #000;}
  table.pt th{font-size:7.5px;font-weight:600;text-align:left;line-height:1.15;vertical-align:bottom;background:#fff;}
  table.pt th.c{text-align:center;}
  table.pt td{font-size:11px;line-height:1.2;vertical-align:middle;background:#fff;}
  table.pt td.n{font-size:10px;text-align:center;width:22px;}
  table.pt td.prod{font-size:10px;line-height:1.2;}
  table.pt td.spec{font-size:10px;}
  table.pt td.cc{text-align:center;}
  table.pt td.cod{min-width:28px;}
  table.pt td.nota{min-height:28px;}
  table.pt td.tick{text-align:center;}
  table.pt tbody tr{height:32px;}
  .tk{width:16px;height:16px;border:1.6px solid #000;display:inline-block;}
  .codes{border:2px solid #000;margin-top:6px;padding:5px 7px;overflow:hidden;}
  .codes b{font-size:9.5px;margin-right:6px;}
  .codes span{font-size:10px;line-height:1.45;}
  .codes .k{font-family:'IBM Plex Mono','Consolas',monospace;font-weight:700;border:1.4px solid #000;
            padding:0 4px;margin:0 3px 0 8px;display:inline-block;}
  .codes .k:first-of-type{margin-left:0;}
  table.totals{width:100%;border-collapse:separate;border-spacing:6px;table-layout:fixed;margin-top:2px;}
  table.totals td{border:2px solid #000;padding:4px 6px;vertical-align:top;}
  table.totals label{display:block;font-size:9.5px;font-weight:600;line-height:1.2;margin:0 0 3px;}
  .ordinc{margin-top:5px;}
  .ordinc span.item{display:inline-block;font-size:11px;margin:0 16px 4px 0;}
  .esc{border:2.5px solid #000;margin-top:7px;padding:5px 8px;}
  .esc h3{margin:0 0 2px;font-size:11px;}
  .esc ol{margin:0;padding-left:16px;font-size:10.5px;line-height:1.45;}
  table.recon{width:100%;border-collapse:separate;border-spacing:0;margin-top:7px;border:2.5px solid #000;}
  table.recon td{border:0;padding:6px 8px;vertical-align:middle;}
  table.recon .q{font-size:11px;font-weight:600;}
  table.recon .tol{font-size:9.8px;margin-top:1px;}
  table.recon .opts{white-space:nowrap;font-size:10.5px;}
  table.signs{width:100%;border-collapse:separate;border-spacing:8px;table-layout:fixed;margin-top:2px;}
  table.signs td.sig{border:1.2px solid #000;padding:4px 6px;vertical-align:top;}
  .sig .role{font-size:10.5px;font-weight:700;}
  .sig .turno{font-size:9.5px;}
  .sig .line{height:1px;background:#000;margin-top:18px;}
  .sig .cap{font-size:9.5px;margin-top:2px;}
  table.deliv{width:100%;border-collapse:separate;border-spacing:8px;table-layout:fixed;margin-top:2px;}
  table.deliv td.accept{border:1.2px solid #000;padding:6px 8px;vertical-align:top;}
  table.deliv td.sello{border:1.2px dashed #000;height:78px;text-align:center;vertical-align:bottom;
                       font-size:9.5px;padding-bottom:6px;width:32%;}
  .accept .item{display:inline-block;font-size:11px;margin:0 10px 4px 0;}
  .accept .motivo{font-size:9.5px;margin-top:6px;}
  .accept .line{height:1px;background:#000;margin-top:4px;margin-bottom:2px;}
  .accept .nombre{font-size:9.5px;margin-top:8px;}
  .foot{margin-top:6px;border-top:1.2px solid #000;padding-top:4px;font-size:9.8px;line-height:1.4;}
  .foot .foto{text-align:right;margin-top:4px;}
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

function buildProductRows(data: OrdenTareaAlmacenPrintData): string {
  const rowCount = Math.max(MIN_PRODUCT_ROWS, data.lineas.length);
  const rows: string[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const linea = data.lineas[index];
    const cantidad = linea?.cantidadSolicitada
      ? fieldValue(linea.cantidadSolicitada)
      : COMB3;
    rows.push(
      `<tr><td class="n">${index + 1}</td>` +
        `<td class="prod">${linea ? fieldValue(linea.producto) : ""}</td>` +
        `<td class="spec">${linea ? fieldValue(linea.especificacion) : ""}</td>` +
        `<td class="cc">${cantidad}</td>` +
        `<td class="cc">${COMB3}</td>` +
        `<td class="cod"></td>` +
        `<td class="nota"></td>` +
        `<td class="tick"><span class="tk"></span></td>` +
        `<td class="tick"><span class="tk"></span></td></tr>`,
    );
  }

  return rows.join("");
}

export function buildOrdenTareaAlmacenHtml(
  data: OrdenTareaAlmacenPrintData,
): string {
  const folio = fieldValue(data.folio);
  const title = `Orden de venta ${data.folio}`;
  const renglones = String(data.lineas.length);

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
  <table class="hdr"><tr>
    <td>
      <h1>ORDEN DE VENTA</h1>
      <div class="folio">
        <span class="mono big">${folio}</span> &nbsp;·&nbsp; Hoja <span class="mono">1</span> de <span class="mono">1</span>
        &nbsp;·&nbsp; Impresa <span class="mono">${fieldValue(data.impresa)}</span><br>
        <b>Factura asociada:</b> <span class="mono">_______________</span>
      </div>
    </td>
    <td class="qr">
      <div class="qrbox">${QR_SVG}</div>
      <div class="qrcap">Escanear y fotografiar</div>
    </td>
  </tr></table>
  <div class="hdr-rule"></div>
  <table class="idgrid">
    <tr>
      <td colspan="2" class="hi"><label>Cliente</label><div class="v">${fieldValue(data.cliente)}</div></td>
      <td><label>Centro de consumo / cocina</label><div class="v">${fieldValue(data.centroConsumo)}</div></td>
      <td><label># de orden del cliente</label><div class="v">${fieldValue(data.numeroOrdenCliente)}</div></td>
    </tr>
    <tr>
      <td><label>Fecha de entrega</label>
        ${data.fechaEntrega ? `<div class="v">${fieldValue(data.fechaEntrega)}</div>` : COMB2 + COMB2 + COMB2}</td>
      <td><label>Hora comprometida</label>${COMB2}${COMB2}</td>
      <td><label>Hora sugerida de salida</label>${COMB2}${COMB2}</td>
      <td><label>Turno que prepara</label>
        <div class="v"><span class="chk"></span> PM &nbsp; <span class="chk"></span> Noche/AM</div></td>
    </tr>
    <tr>
      <td colspan="2" class="addr"><label>Dirección de entrega</label><div class="v">${fieldValue(data.direccionEntrega)}</div></td>
      <td><label>Chofer</label><div class="v"></div></td>
      <td><label>Unidad</label><div class="v"></div></td>
    </tr>
  </table>
  ${sectionTitle("Productos", "Anotar siempre la cantidad preparada. Si difiere de la solicitada, poner el código y explicar en la nota.")}
  <table class="pt">
    <colgroup>
      <col style="width:22px"><col style="width:28%"><col style="width:16%">
      <col style="width:11%"><col style="width:11%">
      <col style="width:32px"><col>
      <col style="width:34px"><col style="width:34px">
    </colgroup>
    <thead>
      <tr>
        <th class="n">#</th><th>Producto</th><th>Especificación</th>
        <th class="c">Cant. solicitada</th><th class="c">Cant. preparada</th>
        <th class="c">Cód.</th><th>Nota</th>
        <th class="c">Alistó</th><th class="c">Revisó</th>
      </tr>
    </thead>
    <tbody>${buildProductRows(data)}</tbody>
  </table>
  <div class="codes">
    <b>Códigos:</b>
    <span class="k">A</span>No había suficiente
    <span class="k">B</span>Se sustituyó
    <span class="k">C</span>Calidad no cumple
    <span class="k">D</span>No está en la factura
    <span class="k">E</span>Especificación poco clara
    <span class="k">F</span>Otro — explicar en la nota
  </div>
  <table class="totals">
    <tr>
      <td><label>Renglones en esta orden</label><div class="v">${fieldValue(renglones)}</div></td>
      <td><label>Renglones surtidos completos</label>${COMB2}</td>
      <td><label>Cajas 1.5 kg / 21 kg</label>${COMB2} &nbsp; ${COMB2}</td>
      <td><label>Total de bultos al camión</label>${COMB3}</td>
    </tr>
  </table>
  ${sectionTitle("De la orden completa", "Lo que no pertenece a un producto en particular.")}
  <div class="ordinc">
    <span class="item"><span class="chk"></span> Orden recibida fuera de horario</span>
    <span class="item"><span class="chk"></span> Factura trae producto que no se pidió</span>
    <span class="item"><span class="chk"></span> Sin factura al momento de revisar</span>
    <span class="item" style="font-weight:700;"><span class="chk"></span> Ninguna incidencia en toda la orden</span>
  </div>
  <div class="esc">
    <h3>Si algo no se puede surtir y no hay a quién preguntarle</h3>
    <ol>
      <li>No sustituir por criterio propio ni dejar el renglón en blanco.</li>
      <li>Anotar la cantidad real preparada (puede ser 0), poner el código en ese renglón y escribir la nota.</li>
      <li>Fotografiar la hoja igual. No se detiene el embarque por esto.</li>
    </ol>
  </div>
  <table class="recon"><tr>
    <td>
      <div class="q">¿La mercancía preparada coincide con la factura impresa?</div>
      <div class="tol">Tolerancia por peso: <b class="mono">± ____ %</b>. Dentro de ese rango se marca «dentro de tolerancia».</div>
    </td>
    <td class="opts">
      <span class="chk lg"></span> Coincide &nbsp;
      <span class="chk lg"></span> Dentro de tolerancia &nbsp;
      <span class="chk lg"></span> Fuera de tolerancia
    </td>
  </tr></table>
  ${sectionTitle("Responsables", "Nombre y hora, siempre.")}
  <table class="signs"><tr>
    <td class="sig"><div class="role">Alistó</div><div class="turno">Turno PM</div><div class="line"></div><div class="cap">Nombre &nbsp;&nbsp;&nbsp; Hora</div></td>
    <td class="sig"><div class="role">Revisó</div><div class="turno">Turno PM</div><div class="line"></div><div class="cap">Nombre &nbsp;&nbsp;&nbsp; Hora</div></td>
    <td class="sig"><div class="role">Documentó</div><div class="turno">Noche / AM</div><div class="line"></div><div class="cap">Nombre &nbsp;&nbsp;&nbsp; Hora</div></td>
    <td class="sig"><div class="role">Despachó</div><div class="turno">Noche / AM</div><div class="line"></div><div class="cap">Nombre &nbsp;&nbsp;&nbsp; Hora</div></td>
  </tr></table>
  ${sectionTitle("Recepción del cliente")}
  <table class="deliv"><tr>
    <td class="accept">
      <span class="item"><span class="chk"></span> Aceptado completo</span>
      <span class="item"><span class="chk"></span> Aceptado parcial</span>
      <span class="item"><span class="chk"></span> Rechazado</span>
      <span class="item"><span class="chk"></span> Retorno de factura</span>
      <div class="motivo">Motivo si es parcial o rechazado — y qué producto</div>
      <div class="line"></div>
      <div class="nombre">Nombre de quien recibe &nbsp;&nbsp;&nbsp; Hora ${COMB2}${COMB2}</div>
      <div class="line"></div>
    </td>
    <td class="sello">Sello y firma del cliente</td>
  </tr></table>
  <div class="foot">
    <b>Cómo se llena:</b> pluma negra o azul, nunca lápiz. Marcar casillas y anotar cantidades dentro de los cuadros.
    Nada de notas al margen ni hojas sueltas. No meter la hoja al cuarto frío.
    <div class="foto">
      <b>Foto 1:</b> al cerrar almacén, antes de subir al camión.
      &nbsp; <b>Foto 2:</b> ya firmada por el cliente.
      &nbsp; Hoja plana, sin sombra.
    </div>
  </div>
</div>
</body>
</html>`;
}
