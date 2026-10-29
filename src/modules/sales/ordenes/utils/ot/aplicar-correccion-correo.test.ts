import { describe, expect, it } from "vitest";
import { groupOrigenCorreoToOrdenesTrabajo } from "../origen/origen-correo-ordenes-trabajo";
import { buildPedidoExtraidoFromOrigenCorreo } from "../origen/pedido-from-origen-correo";
import { mapPedidoExtraidoToForm } from "../pedido/map-pedido-extraido-to-form";
import {
  describirCorreccionParaBitacora,
  describirEspera,
  ESPERA_INTERPRETAR,
  ESPERA_REORGANIZAR,
  ESPERA_RELEER,
  documentosSinVerificar,
  formatearImporte,
  origenCorreoDePropuesta,
  puedeAplicarCorreccion,
  type DocumentoCorreccionApi,
  type PropuestaCorreccionCorreoApi,
} from "./aplicar-correccion-correo";

function documento(parcial: Partial<DocumentoCorreccionApi> = {}): DocumentoCorreccionApi {
  return {
    nombre: "pedido.pdf",
    oc: "4502987208",
    ocFuente: "ambas",
    renglones: 2,
    verificacion: { totalDocumento: 30, importe: 30, diferencia: 0, cuadra: true },
    relecturaPorBloques: false,
    ...parcial,
  };
}

function propuesta(parcial: Partial<PropuestaCorreccionCorreoApi> = {}): PropuestaCorreccionCorreoApi {
  return {
    requestId: "r",
    propuestaId: "p",
    baseHash: "h",
    documentos: [documento()],
    ots: [
      {
        id: "pedido:4502987208|almacen:abar bares",
        etiqueta: "4502987208 — ABAR Bares",
        numeroPedido: "4502987208",
        almacen: "ABAR Bares",
        totalCantidad: 3,
        renglones: [
          { Producto: "A", Cantidad: 1, Almacen: "ABAR Bares", "Numero pedido": "4502987208" },
          { Producto: "B", Cantidad: 2, Almacen: "ABAR Bares", "Numero pedido": "4502987208" },
        ],
      },
      {
        id: "pedido:4502987208|almacen:acoe",
        etiqueta: "4502987208 — ACOE",
        numeroPedido: "4502987208",
        almacen: "ACOE",
        totalCantidad: 1,
        renglones: [{ Producto: "C", Cantidad: 1, Almacen: "ACOE", "Numero pedido": "4502987208" }],
      },
    ],
    resumen: {
      otAntes: 1,
      otDespues: 2,
      renglonesAntes: 2,
      renglonesDespues: 3,
      importeAntes: 10,
      importeDespues: 30,
    },
    diff: { otNuevas: ["x"], otEliminadas: [], renglonesAgregados: 1, renglonesQuitados: 0 },
    advertencias: [],
    ...parcial,
  };
}

describe("origenCorreoDePropuesta", () => {
  it("aplana los renglones de todas las OT en orden y los copia", () => {
    const p = propuesta();
    const filas = origenCorreoDePropuesta(p);
    expect(filas.map((f) => f.Producto)).toEqual(["A", "B", "C"]);
    filas[0]!.Producto = "cambiado";
    expect(p.ots[0]!.renglones[0]!.Producto).toBe("A");
  });
});

describe("puedeAplicarCorreccion", () => {
  it("sí cuando hay cambios y los documentos cuadran", () => {
    expect(puedeAplicarCorreccion(propuesta())).toBe(true);
  });

  it("no si un documento declara un total que no cuadra", () => {
    const p = propuesta({
      documentos: [
        documento({
          verificacion: { totalDocumento: 30, importe: 10, diferencia: -20, cuadra: false },
        }),
      ],
    });
    expect(puedeAplicarCorreccion(p)).toBe(false);
  });

  it("no si la propuesta no cambia nada", () => {
    const p = propuesta({
      diff: { otNuevas: [], otEliminadas: [], renglonesAgregados: 0, renglonesQuitados: 0 },
    });
    expect(puedeAplicarCorreccion(p)).toBe(false);
  });

  it("no si no hay OT", () => {
    expect(puedeAplicarCorreccion(propuesta({ ots: [] }))).toBe(false);
  });

  it("un documento no verificable (cuadra = null) no bloquea", () => {
    const p = propuesta({
      documentos: [
        documento({ verificacion: { totalDocumento: null, importe: 5, diferencia: null, cuadra: null } }),
      ],
    });
    expect(puedeAplicarCorreccion(p)).toBe(true);
    expect(documentosSinVerificar(p)).toHaveLength(1);
  });
});

describe("describirCorreccionParaBitacora", () => {
  it("resume antes → después y no incluye renglones ni textos de productos", () => {
    const p = propuesta();
    const { mensaje, payloadExtra } = describirCorreccionParaBitacora({
      autor: "Andrés",
      resumen: p.resumen,
      documentos: p.documentos,
    });
    expect(mensaje).toContain("1 → 2 OT");
    expect(mensaje).toContain("2 → 3 renglones");
    const json = JSON.stringify(payloadExtra);
    expect(json).toContain("4502987208");
    expect(json).not.toContain('"Producto"');
  });

  it("limita los documentos que se registran", () => {
    const muchos = Array.from({ length: 30 }, (_, i) => documento({ nombre: `d${i}.pdf` }));
    const { payloadExtra } = describirCorreccionParaBitacora({
      autor: "x",
      resumen: propuesta().resumen,
      documentos: muchos,
    });
    const docs = (payloadExtra.correccionCorreoIa as { documentos: unknown[] }).documentos;
    expect(docs).toHaveLength(10);
  });
});

describe("formatearImporte", () => {
  it("usa dos decimales", () => {
    expect(formatearImporte(27905.25)).toMatch(/27.905,25|27,905\.25/);
    expect(formatearImporte(10)).toMatch(/10[.,]00/);
  });
});

describe("aplicar la propuesta al formulario (mismo flujo que abrir una OV externa)", () => {
  const ficha = {
    centroConsumo: "",
    ventanaDesde: "",
    ventanaHasta: "",
    direccion: "",
    anden: "",
    contacto: "",
    telefono: "",
    correo: "",
    aceptaSustituciones: "",
    requiereLote: "",
    registrarTemperatura: "",
    observaciones: "",
  };

  /** OV-943: dos OC con los mismos almacenes y el mismo producto en cada una. */
  function filasDosOc() {
    const filas = [];
    for (const oc of ["4502987081", "4502987208"]) {
      for (const almacen of ["ABAN Banquetes Ali", "ABAR Bares", "ACOE ComedorEmplea"]) {
        for (const producto of ["AGUACATE HASS", "FRESA DE 4 CM"]) {
          filas.push({
            Producto: producto,
            Almacen: almacen,
            Cantidad: 2,
            Precio: 10,
            "Numero pedido": oc,
            Fecha: "2026-10-30",
          });
        }
      }
    }
    return filas;
  }

  it("cada línea cae en la OT de su OC y almacén, aunque otra OC tenga el mismo producto y almacén", () => {
    const filas = filasDosOc();
    const pedido = buildPedidoExtraidoFromOrigenCorreo({ origenCorreo: filas });
    pedido.lineas = pedido.lineas.map((linea, i) => ({
      ...linea,
      numeroPedido: String(filas[i]!["Numero pedido"]),
    }));
    const mapped = mapPedidoExtraidoToForm({
      pedido,
      productos: [],
      ficha,
      tomorrowIso: "2026-10-30",
      todayIso: "2026-10-29",
    });
    const hijas = groupOrigenCorreoToOrdenesTrabajo(filas);

    expect(hijas).toHaveLength(6);
    expect(mapped.lineas).toHaveLength(filas.length);
    const idsDeOt = new Set(hijas.map((h) => h.id));
    for (const linea of mapped.lineas) {
      expect(idsDeOt.has(linea.otId)).toBe(true);
    }
    for (const hija of hijas) {
      const enOt = mapped.lineas.filter((l) => l.otId === hija.id);
      expect(enOt).toHaveLength(hija.renglones.length);
    }
  });

  it("los productos sin catálogo quedan marcados en vez de perderse", () => {
    const filas = filasDosOc();
    const pedido = buildPedidoExtraidoFromOrigenCorreo({ origenCorreo: filas });
    const mapped = mapPedidoExtraidoToForm({
      pedido,
      productos: [],
      ficha,
      tomorrowIso: "2026-10-30",
      todayIso: "2026-10-29",
    });
    expect(mapped.lineas.every((l) => l.catalogPending || l.idProducto === "")).toBe(true);
  });
});

describe("describirEspera", () => {
  it.each([
    [{ minSeg: 5, maxSeg: 30 }, "Este proceso puede tardar entre 5 y 30 segundos."],
    [{ minSeg: 60, maxSeg: 180 }, "Este proceso puede tardar entre 1 y 3 minutos."],
    [{ minSeg: 40, maxSeg: 120 }, "Este proceso puede tardar entre 40 segundos y 2 minutos."],
    [{ minSeg: 1, maxSeg: 1 }, "Este proceso puede tardar entre 1 y 1 segundo."],
  ])("%j → %s", (rango, texto) => {
    expect(describirEspera(rango)).toBe(texto);
  });

  it("los rangos de cada etapa vienen de lo medido y van de menor a mayor", () => {
    for (const rango of [ESPERA_INTERPRETAR, ESPERA_REORGANIZAR, ESPERA_RELEER]) {
      expect(rango.minSeg).toBeGreaterThan(0);
      expect(rango.maxSeg).toBeGreaterThan(rango.minSeg);
    }
    // Releer (51–142 s medidos) cae dentro de su rango anunciado.
    expect(ESPERA_RELEER.minSeg).toBeLessThanOrEqual(60);
    expect(ESPERA_RELEER.maxSeg).toBeGreaterThanOrEqual(142);
  });
});
