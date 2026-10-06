import { describe, expect, it } from "vitest";
import {
  buildTextoOrigenPedido,
  cleanCorreoBodyForNotas,
  extractNotasClaveCorreo,
  fitNotasGeneralesPdf,
  flattenNotasForPdf,
  parseOrigenPedidoBlocks,
  serializeCuerpoMensaje,
} from "./texto-origen-pedido";

describe("parseOrigenPedidoBlocks", () => {
  it("separa prosa y tabla ASCII en bloques", () => {
    const raw = [
      "Buenas tardes,",
      "Envio adjunto pedido para Parque Xcaret.",
      "",
      "Fecha de entrega   Clave Sap    Texto breve de material   Um   Pedido",
      "                   X200011700   AGUACATE JASS             KG   37",
      "                   X200011701   LIMON                     KG   10",
    ].join("\n");

    const blocks = parseOrigenPedidoBlocks(raw);
    expect(blocks[0]).toEqual({
      type: "text",
      text: "Buenas tardes,\nEnvio adjunto pedido para Parque Xcaret.",
    });
    expect(blocks[1]?.type).toBe("table");
    if (blocks[1]?.type === "table") {
      expect(blocks[1].rows[0]?.[1]).toBe("Clave Sap");
      expect(blocks[1].rows[1]?.[1]).toBe("X200011700");
      expect(blocks[1].rows[1]?.[2]).toBe("AGUACATE JASS");
    }
  });

  it("une celdas partidas por wrap y arma tabla", () => {
    const raw = [
      "Buenas tardes,",
      "Fecha de entrega   Clave Sap    Texto breve   Centro de costo",
      "27.08.2026         X200062800   BLUE BERRY    Ayb Xc Restaurant Baja",
      " California",
    ].join("\n");
    const blocks = parseOrigenPedidoBlocks(raw);
    expect(blocks[1]?.type).toBe("table");
    if (blocks[1]?.type === "table") {
      expect(blocks[1].rows[1]?.join(" ")).toContain("Baja California");
    }
  });

  it("renderiza el cuerpo organizado por la IA como prosa + tabla", () => {
    const raw = serializeCuerpoMensaje([
      {
        tipo: "texto",
        texto: "Buenas tardes,\nHora de entrega 6:00 am",
        filas: null,
      },
      {
        tipo: "tabla",
        texto: null,
        filas: [
          ["Fecha de entrega", "Clave Sap", "Texto breve de material"],
          ["27.08.2026", "X200062800", "BLUE BERRY"],
        ],
      },
      { tipo: "texto", texto: "Favor de confirmar de recibido", filas: null },
    ]);
    const blocks = parseOrigenPedidoBlocks(raw);
    expect(blocks.map((b) => b.type)).toEqual(["text", "table", "text"]);
    if (blocks[1]?.type === "table") {
      expect(blocks[1].rows[1]?.[2]).toBe("BLUE BERRY");
    }
  });
});

describe("cleanCorreoBodyForNotas", () => {
  it("deja solo el cuerpo, sin forward ni disclaimer", () => {
    const raw = [
      "---------- Forwarded message ---------",
      "De: Sandy Herrera del Oso <sandy.herreradeloso@seadustcancun.com>",
      "Date: mié, 26 ago 2026 a la(s) 3:51 p.m.",
      "Subject: RE: ORDEN DE COMPRA PO4030,4029 Y 4034 || AGUACATES PUEBLA ||",
      "HOTEL SEADUST",
      "To: facturacion@aguacatesdepuebla.com <facturacion@aguacatesdepuebla.com>",
      "Cc: Martha Bonilla <martha.bonilla@seadustcancun.com>",
      "",
      "",
      "Buen Dia Homero.",
      "",
      "El motivo de mi correo es para hacerte llegar nuestro pedido para su",
      "programacion de entrega.",
      "",
      "Quedo atenta a tus comentarios",
      "",
      "Gracias",
      "",
      "Saludos",
      "",
      "La presente comunicación electrónica es confidencial, privilegiada y no podrá ser divulgada.",
      "This electronic communication is confidential.",
    ].join("\n");

    const cleaned = cleanCorreoBodyForNotas(raw);
    expect(cleaned).toBe(
      [
        "Buen Dia Homero.",
        "",
        "El motivo de mi correo es para hacerte llegar nuestro pedido para su",
        "programacion de entrega.",
        "",
        "Quedo atenta a tus comentarios",
        "",
        "Gracias",
        "",
        "Saludos",
      ].join("\n"),
    );
    expect(cleaned).not.toContain("Forwarded message");
    expect(cleaned).not.toContain("Sandy Herrera");
    expect(cleaned).not.toContain("Subject:");
    expect(cleaned).not.toContain("comunicación electrónica");
  });

  it("recorta el disclaimer legal cuando no hay forward", () => {
    const raw = [
      "Buen Dia Homero.",
      "",
      "El motivo de mi correo es para hacerte llegar nuestro pedido.",
      "",
      "Gracias",
      "",
      "La presente comunicación electrónica es confidencial, privilegiada y no podrá ser divulgada.",
    ].join("\n");

    const cleaned = cleanCorreoBodyForNotas(raw);
    expect(cleaned).toContain("Buen Dia Homero");
    expect(cleaned).not.toContain("comunicación electrónica");
  });

  it("no aplasta columnas de una tabla ASCII", () => {
    const raw =
      "Fecha   Clave    Producto\n" + "hoy     X200     AGUACATE JASS";
    const cleaned = cleanCorreoBodyForNotas(raw);
    expect(cleaned).toContain("  ");
    expect(cleaned.split("\n")[0]).toMatch(/Fecha\s{2,}Clave/);
  });
});

describe("flattenNotasForPdf", () => {
  it("colapsa saltos para llenar líneas del PDF sin huecos", () => {
    expect(
      flattenNotasForPdf(
        "Buen Dia Homero.\n\nEl motivo de mi correo.\n\nSaludos",
      ),
    ).toBe("Buen Dia Homero. El motivo de mi correo. Saludos");
  });
});

describe("fitNotasGeneralesPdf", () => {
  it("recorta sin partir la última palabra", () => {
    const long = Array.from({ length: 40 }, (_, i) => `dato${i}`).join(" ");
    const fitted = fitNotasGeneralesPdf(long, 40);
    expect(fitted.length).toBeLessThanOrEqual(40);
    expect(fitted.endsWith(" ")).toBe(false);
    expect(fitted.includes("dato0")).toBe(true);
  });
});

describe("extractNotasClaveCorreo", () => {
  it("deja solo notas útiles, sin saludos ni tablas de productos", () => {
    const raw = [
      "Buenas tardes,",
      "Favor de enviar maduro, no verde. Entregar por andén 3.",
      "",
      "Fecha de entrega   Clave Sap    Texto breve de material   Um   Pedido",
      "                   X200011700   AGUACATE JASS             KG   37",
      "",
      "Gracias",
      "Saludos",
    ].join("\n");

    expect(extractNotasClaveCorreo(raw)).toBe(
      "Favor de enviar maduro, no verde. Entregar por andén 3.",
    );
  });

  it("saca del correo solo la especificación de entrega, no el cuerpo ni la firma", () => {
    const raw = [
      "Buenas tardes,",
      "Envío adjunto pedido para entregar el 27 DE AGOSTO DE 2026 en Parque Xcaret:",
      "Hora de entrega 6:00 am",
      "Favor de confirmar de recibido",
      "Nancy Guadalupe Pérez Cruz",
      "Gestor de Inventarios",
      "CONTRALORIA",
      "XCARET",
      "nperezcru@xcaret.com",
    ].join("\n");
    expect(extractNotasClaveCorreo(raw)).toContain("27 DE AGOSTO DE 2026");
    expect(extractNotasClaveCorreo(raw)).toContain("Parque Xcaret");
    expect(extractNotasClaveCorreo(raw)).toContain("Hora de entrega 6:00 am");
    expect(extractNotasClaveCorreo(raw)).not.toContain("Buenas tardes");
    expect(extractNotasClaveCorreo(raw)).not.toContain("Nancy");
    expect(extractNotasClaveCorreo(raw)).not.toContain("nperezcru");
  });
});

describe("buildTextoOrigenPedido", () => {
  it("prioriza el texto pegado sobre archivos", () => {
    const result = buildTextoOrigenPedido("Pedido pegado a mano", [
      {
        nombre: "correo.eml — cuerpo",
        tipo: "texto",
        contenido: "Cuerpo del correo",
      },
    ]);
    expect(result).toBe("Pedido pegado a mano");
  });

  it("usa el cuerpo del .eml cuando no hay texto pegado", () => {
    const result = buildTextoOrigenPedido("", [
      {
        nombre: "seadust.eml — cuerpo",
        tipo: "texto",
        contenido: [
          "---------- Forwarded message ---------",
          "De: Sandy <sandy@seadust.com>",
          "Subject: RE: ORDEN",
          "To: facturacion@aguacatesdepuebla.com",
          "",
          "Buen Dia Homero.",
          "Quedo atenta a tus comentarios",
          "Gracias",
          "Saludos",
          "La presente comunicación electrónica es confidencial.",
        ].join("\n"),
      },
      {
        nombre: "seadust.eml → OC.pdf",
        tipo: "texto",
        contenido: "Orden de compra #PO4029 ...",
      },
    ]);
    expect(result).toContain("Buen Dia Homero");
    expect(result).toContain("Quedo atenta");
    expect(result).toContain("Saludos");
    expect(result).not.toContain("Forwarded message");
    expect(result).not.toContain("PO4029");
    expect(result).not.toContain("comunicación electrónica");
  });

  it("ignora adjuntos con flecha y cae a textos sueltos", () => {
    const result = buildTextoOrigenPedido("", [
      {
        nombre: "pedido.txt",
        tipo: "texto",
        contenido: "Necesitamos 20 kg de limón",
      },
      {
        nombre: "correo.eml → hoja.xlsx",
        tipo: "texto",
        contenido: "COCINA,PRECIO",
      },
    ]);
    expect(result).toBe("Necesitamos 20 kg de limón");
  });
});
