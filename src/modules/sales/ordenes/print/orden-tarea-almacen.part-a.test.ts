import { describe, expect, it } from "vitest";
import { buildOrdenTareaAlmacenHtml } from "./build-orden-tarea-almacen-html";
import { buildOrdenTareaAlmacenLandscapePdf } from "./render-orden-tarea-almacen-landscape-pdf";
import { buildOrdenTareaAlmacenPdf } from "./render-orden-tarea-almacen-pdf";
import { formatOrdenTareaImpresaAt, mapOrdenVentaToAlmacenPrintData } from "./map-orden-tarea-almacen";
import { DETALLE, LIST_ROW } from "./orden-tarea-almacen.test-helpers";

describe("orden de tarea almacén", () => {
  it("REQ-178: cliente es la razón social y trae la denominación comercial aparte", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        comprador_razon_social: "PACIFIC & CARIBBEAN SEAFOOD S DE RL DE CV",
        comprador_apodo: "Marbella",
      },
    });

    expect(data.cliente).toBe("PACIFIC & CARIBBEAN SEAFOOD S DE RL DE CV");
    expect(data.clienteDenominacionComercial).toBe("Marbella");
  });


  it("REQ-178: sin razón social cae al nombre; sin apodo la denominación queda vacía", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: { ...DETALLE, comprador_razon_social: "  ", comprador_apodo: null },
    });

    expect(data.cliente).toBe("Edgar Escobar");
    expect(data.clienteDenominacionComercial).toBe("");
  });


  it("REQ-178: el HTML rotula Razón Social y Denominación Comercial y cabe en una hoja", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        comprador_razon_social: "PACIFIC & CARIBBEAN SEAFOOD S DE RL DE CV",
        comprador_apodo: "Marbella",
      },
    });
    const html = buildOrdenTareaAlmacenHtml(data);

    expect(html).toContain("Cliente: Razón Social");
    expect(html).toContain("Cliente: Denominación Comercial");
    expect(html).toContain("Marbella");
    expect(buildOrdenTareaAlmacenPdf(data).getNumberOfPages()).toBe(1);
    expect(buildOrdenTareaAlmacenLandscapePdf(data).getNumberOfPages()).toBe(1);
  });


  it("si hay notas de almacén editadas, el PDF usa esas (no el correo)", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        origen_texto: [
          "Estimado proveedor,",
          "Adjunto le remito la orden de compra. En caso de haber faltantes, favor de mencionar.",
          "Le recuerdo que es necesario que su chofer traiga la OC impresa.",
        ].join("\n"),
        notas_almacen:
          "que su chofer traiga la OC impresa al momento de la entrega junto con su factura fiscal. Por favor traer únicamente dos facturas junto con la orden de compra",
      },
    });
    expect(data.notasGenerales).toMatch(/dos facturas/i);
    expect(data.notasGenerales).not.toMatch(/Adjunto le remito/i);
    expect(data.notasGenerales).not.toMatch(/faltantes/i);
  });


  it("REQ-281: sin notas_almacen en BD, el PDF no reinyecta el correo", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        origen_texto: [
          "Buenas tardes,",
          "Pedido de FYV para Hotel Ava. Llevar 3 juegos.",
          "Clave Sap   Texto breve   Um",
          "X200011700  AGUACATE       KG",
          "Gracias",
        ].join("\n"),
        notas_almacen: "",
      },
    });
    expect(data.notasGenerales).toBe("");
  });


  it("mapea folio, cliente y productos de la venta", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: DETALLE,
      printedAt: new Date("2026-08-26T17:44:00"),
    });

    expect(data.folio).toBe("OV-001");
    expect(data.cliente).toBe("Edgar Escobar");
    expect(data.cliente).not.toContain("3Q12U");
    expect(data.lineas[0]?.producto).toBe("HPR FROZEN-PORK RACKS");
    expect(data.lineas[0]?.especificacion).toBe("");
    expect(data.lineas[0]?.cantidadSolicitada).toBe("10 kg");
    expect(data.creada).toBe(
      formatOrdenTareaImpresaAt(new Date(DETALLE.created_at)),
    );
    expect(data.impresa).toBe(
      formatOrdenTareaImpresaAt(new Date("2026-08-26T17:44:00")),
    );
    // DD-MMM-AAAA HH:mm (REQ-320)
    expect(data.creada).toMatch(/^\d{2}-[A-ZÁÉÍÓÚÜ]{3}-\d{4} \d{2}:\d{2}$/);
    expect(data.impresa).toMatch(/^\d{2}-[A-ZÁÉÍÓÚÜ]{3}-\d{4} \d{2}:\d{2}$/);
  });


  it("usa unidad_medida persistida en cantidad solicitada (no fuerza kg)", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        lineas: [
          {
            ...DETALLE.lineas[0]!,
            cantidad_pedida: 5,
            unidad_medida: "LTR",
          },
        ],
      },
      printedAt: new Date("2026-08-26T17:44:00"),
    });

    expect(data.lineas[0]?.cantidadSolicitada).toBe("5 LTR");
  });


  it("Creada usa created_at de la OV y no la hora de impresión", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        created_at: "2026-06-28T12:00:00.000Z",
        fecha_pedido: "2026-06-28T12:00:00.000Z",
      },
      printedAt: new Date("2026-10-08T14:06:00.000Z"),
    });
    expect(data.creada).toBe(
      formatOrdenTareaImpresaAt(new Date("2026-06-28T12:00:00.000Z")),
    );
    expect(data.impresa).toBe(
      formatOrdenTareaImpresaAt(new Date("2026-10-08T14:06:00.000Z")),
    );
    expect(data.creada).not.toBe(data.impresa);
  });


  it("lee centro, entrega y especificación desde la captura del pedido", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: {
        ...DETALLE,
        observaciones: [
          "Fecha de entrega: 2026-09-03",
          "Orden de compra del hotel: OC-88",
          "Centro de consumo: Cocina de banquetes",
          "Dirección de entrega: Km 282",
          "",
          "HPR FROZEN-PORK RACKS: Firme · 2 cajas",
        ].join("\n"),
      },
      printedAt: new Date("2026-08-26T17:44:00"),
    });

    expect(data.centroConsumo).toBe("Cocina de banquetes");
    expect(data.numeroOrdenCliente).toBe("OC-88");
    expect(data.fechaEntrega).toBe("03-SEP-2026 (JUEVES)");
    expect(data.direccionEntrega).toBe("Km 282");
    expect(data.lineas[0]?.especificacion).toBe("Firme · 2 cajas");
  });


  it("incluye folio y productos en el HTML de la hoja", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: DETALLE,
      printedAt: new Date("2026-08-26T17:44:00"),
    });
    const html = buildOrdenTareaAlmacenHtml(data);

    expect(html).toContain("OV-001");
    expect(html).toContain("<label>Orden de venta</label>");
    expect(html).not.toContain("<label>Tarea de Almacén</label>");
    expect(html).toContain("Creada ");
    expect(html).toContain("Impresa ");
    expect(html).toContain("HPR FROZEN-PORK RACKS");
    expect(html).not.toContain("ORDEN DE VENTA");
    expect(html).not.toContain(">Folio<");
    expect(html).not.toContain("<label>Folio</label>");
    expect(html).toContain("216mm 330mm");
    expect(html).not.toContain("IOZ7Z");
    expect(html).not.toContain("Si algo no salió");
    expect(html).toContain("<th class=\"c\">Alistó</th>");
    expect(html).toContain("<th class=\"c\">Revisó</th>");
    expect(html).toContain("Hora de entrega");
    expect(html).not.toContain("Notas generales");
    expect(html).toContain("Cliente");
    expect(html).toContain("Centro de consumo");
    expect(html).not.toContain("Centro de consumo / cocina");
    expect(html).toContain("Fecha de entrega");
    expect(html).toContain("Dirección de entrega");
    expect(html).toContain("# de orden del cliente");
    expect(html).toContain("Folio factura asociada");
    expect(html).not.toContain("<label>Factura asociada</label>");
    expect(html).not.toContain("Escanear y fotografiar");
    expect(html).not.toContain("<label>Impresa</label>");
    expect(html).not.toContain("Turno que prepara");
    expect(html).not.toContain("Chofer");
    expect(html).not.toContain("Hora comprometida");
    expect(html).not.toContain("Hora sugerida de salida");
    expect(html).not.toContain("Cant. preparada");
    expect(html).not.toContain("Códigos:");
    expect(html).not.toContain("Renglones en esta orden");
    expect(html).not.toContain("No había suficiente");
    expect(html).not.toContain("Recepción del cliente");
    expect(html).not.toContain("Sello y firma del cliente");
    expect(html).not.toContain("De la orden completa");
    expect(html).not.toContain("Si algo no se puede surtir");
    expect(html).not.toContain("coincide con la factura impresa");
    expect(html).not.toContain("Responsables");
    expect(html).not.toContain('<div class="role">Documentó</div>');
    expect(html).not.toContain("Turno PM");
    expect(html).not.toContain("Noche / AM");
    expect(html).not.toContain("Facturó");
    expect(html).not.toContain("Factura (OK)");
    expect(html).toContain('<div class="role">Documentación</div>');
    expect(html).toContain("Retorno");
    expect(html).toContain("Despachó");
    expect(html).toContain("Firma");
    expect(html).toContain("Fecha");
    expect(html).not.toContain("Cómo se llena");
    expect(html).not.toContain("Foto:");
    expect(html).not.toContain("Notas generales:");
    expect(html).not.toContain("Notas:");
    expect(html).toContain("Incidencias");
    expect(html).not.toContain(">Productos<");
    expect(html).toContain("page-meta");
    expect(html).toContain("Creada");
    expect(html).toContain("Impresa");
    expect(html).not.toContain("Orden de tarea 1/1");
    expect(html).toContain("Orden de trabajo");
    expect(html).not.toContain("Hoja 1 de 1");
    expect(html).not.toMatch(/page-meta[^>]*>OV-/);
    expect(html).toContain('class="notes-block"');
    expect(html).toContain('colspan="3"');
    expect(html).toContain('class="products-wrap"');
    expect(html).toContain('class="n">26</td>');
    expect(html).toContain('class="n">50</td>');
  });


  it("deja la especificación vacía si el pedido no trajo nota de línea", () => {
    const data = mapOrdenVentaToAlmacenPrintData({
      listRow: LIST_ROW,
      detalle: DETALLE,
    });
    expect(data.lineas[0]?.especificacion).toBe("");
  });

});
