import { describe, expect, it } from "vitest";
import { formatearXmlParaVista } from "./xml-vista";

describe("formatearXmlParaVista", () => {
  it("parte un XML de una línea en etiquetas y atributos", () => {
    const bruto =
      '<?xml version="1.0"?><cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Folio="1" Total="5"><cfdi:Concepto Descripcion="FRESA" Importe="5"/></cfdi:Comprobante>';
    const visto = formatearXmlParaVista(bruto);
    expect(visto).toContain('<?xml version="1.0"?>');
    expect(visto).toContain("\n<cfdi:Comprobante");
    expect(visto).toContain('\n  Folio="1"');
    expect(visto).toContain('\n  Total="5"');
    expect(visto).toContain("\n  <cfdi:Concepto");
    expect(visto).toContain('\n    Descripcion="FRESA"');
    expect(visto).toContain("\n</cfdi:Comprobante>");
  });

  it("deja el texto si no es XML", () => {
    expect(formatearXmlParaVista("no es xml <")).toBe("no es xml <");
  });
});
