const NS_CFDI = ["http://www.sat.gob.mx/cfd/4", "http://www.sat.gob.mx/cfd/3"];

const TIPO_COMPROBANTE: Record<string, string> = {
  I: "Factura",
  E: "Nota de crédito",
  T: "Traslado",
  N: "Nómina",
  P: "Pago",
};

export type LineaCfdiVista = {
  descripcion: string;
  cantidad: string;
  importe: string;
};

export type CfdiVista = {
  tipo: string;
  folio: string;
  fecha: string;
  moneda: string;
  subtotal: string;
  total: string;
  emisor: string;
  emisorRfc: string;
  receptor: string;
  receptorRfc: string;
  lineas: LineaCfdiVista[];
};

function atributo(elemento: Element | null, nombre: string): string {
  return elemento?.getAttribute(nombre)?.trim() ?? "";
}

function hijosPorNombre(raiz: Element, local: string): Element[] {
  for (const ns of NS_CFDI) {
    const encontrados = Array.from(raiz.getElementsByTagNameNS(ns, local));
    if (encontrados.length > 0) return encontrados;
  }
  return Array.from(raiz.getElementsByTagName(`cfdi:${local}`));
}

/** Si el XML es un CFDI del SAT, los datos que un operador necesita ver. Si no, `null`. */
export function leerCfdiParaVista(texto: string): CfdiVista | null {
  const documento = new DOMParser().parseFromString(texto, "application/xml");
  if (documento.getElementsByTagName("parsererror").length > 0) return null;
  const raiz = documento.documentElement;
  if (!raiz || !/Comprobante$/i.test(raiz.localName || raiz.tagName)) return null;
  const emisor = hijosPorNombre(raiz, "Emisor")[0] ?? null;
  const receptor = hijosPorNombre(raiz, "Receptor")[0] ?? null;
  const tipo = atributo(raiz, "TipoDeComprobante");
  const serie = atributo(raiz, "Serie").replace(/-+$/, "");
  const folio = atributo(raiz, "Folio");
  return {
    tipo: TIPO_COMPROBANTE[tipo] ?? "Comprobante",
    folio: [serie, folio].filter(Boolean).join("-") || "—",
    fecha: atributo(raiz, "Fecha") || "—",
    moneda: atributo(raiz, "Moneda"),
    subtotal: atributo(raiz, "SubTotal"),
    total: atributo(raiz, "Total"),
    emisor: atributo(emisor, "Nombre") || "—",
    emisorRfc: atributo(emisor, "Rfc"),
    receptor: atributo(receptor, "Nombre") || "—",
    receptorRfc: atributo(receptor, "Rfc"),
    lineas: hijosPorNombre(raiz, "Concepto").map((concepto) => ({
      descripcion: atributo(concepto, "Descripcion") || "—",
      cantidad: atributo(concepto, "Cantidad") || "—",
      importe: atributo(concepto, "Importe") || "—",
    })),
  };
}
