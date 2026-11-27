import { describe, expect, it } from "vitest";
import {
  mensajeEstadoCorreccion,
  puedeAplicarCorreccion,
  type DocumentoCorreccionApi,
  type PropuestaCorreccionCorreoApi,
} from "./aplicar-correccion-correo";
import {
  totalDeclaradoPorDocumentos,
  totalDocumentoQueFormularioNoCuadra,
} from "./total-formulario-correccion";

function documento(total: number | null, importe = total ?? 0): DocumentoCorreccionApi {
  return {
    nombre: "pedido.pdf",
    oc: "4503005858",
    ocFuente: "ambas",
    renglones: 12,
    verificacion: {
      totalDocumento: total,
      importe,
      diferencia: total === null ? null : importe - total,
      cuadra: total === null ? null : importe === total,
    },
    relecturaPorBloques: false,
  };
}

/** SOLAYA / OV-00002860: el correo y la relectura suman 1,869.00 y no hay nada que mover. */
function propuesta(parcial: Partial<PropuestaCorreccionCorreoApi> = {}): PropuestaCorreccionCorreoApi {
  return {
    requestId: "r",
    propuestaId: "p",
    baseHash: "h",
    documentos: [documento(1869)],
    ots: [
      {
        id: "pedido:4503005858|almacen:coeg",
        etiqueta: "4503005858 — COEG",
        numeroPedido: "4503005858",
        almacen: "COEG",
        totalCantidad: 4,
        renglones: [{ Producto: "LECHUGA LARGA", Cantidad: 4, Precio: 46 }],
      },
    ],
    resumen: {
      otAntes: 2,
      otDespues: 2,
      renglonesAntes: 12,
      renglonesDespues: 12,
      importeAntes: 1869,
      importeDespues: 1869,
    },
    diff: { otNuevas: [], otEliminadas: [], renglonesAgregados: 0, renglonesQuitados: 0 },
    advertencias: [],
    ...parcial,
  };
}

describe("totalDeclaradoPorDocumentos (REQ-425)", () => {
  it("suma los totales declarados de todos los documentos", () => {
    expect(totalDeclaradoPorDocumentos(propuesta())).toBe(1869);
    expect(totalDeclaradoPorDocumentos(propuesta({ documentos: [documento(30), documento(12.5)] }))).toBe(42.5);
  });

  it("no inventa un total si algún documento no lo declara o no hay documentos", () => {
    expect(totalDeclaradoPorDocumentos(propuesta({ documentos: [documento(30), documento(null)] }))).toBeNull();
    expect(totalDeclaradoPorDocumentos(propuesta({ documentos: [] }))).toBeNull();
  });
});

describe("totalDocumentoQueFormularioNoCuadra (REQ-425)", () => {
  it("devuelve el total del documento cuando el formulario se desvió", () => {
    expect(totalDocumentoQueFormularioNoCuadra(propuesta(), 1793)).toBe(1869);
  });

  it("tolera centavos de redondeo y no opina sin importe válido", () => {
    expect(totalDocumentoQueFormularioNoCuadra(propuesta(), 1869)).toBeNull();
    expect(totalDocumentoQueFormularioNoCuadra(propuesta(), 1868.97)).toBeNull();
    expect(totalDocumentoQueFormularioNoCuadra(propuesta(), undefined)).toBeNull();
    expect(totalDocumentoQueFormularioNoCuadra(propuesta(), null)).toBeNull();
    expect(totalDocumentoQueFormularioNoCuadra(propuesta(), Number.NaN)).toBeNull();
  });
});

describe("corrección con el formulario desviado del documento (REQ-425)", () => {
  it("sin cambios estructurales, deja aplicar y avisa los dos totales", () => {
    const p = propuesta();
    expect(puedeAplicarCorreccion(p, 1793)).toBe(true);
    const estado = mensajeEstadoCorreccion(p, 1793);
    expect(estado?.tono).toBe("aviso");
    expect(estado?.texto).toContain("1,793.00");
    expect(estado?.texto).toContain("1,869.00");
    expect(estado?.texto).not.toMatch(/ya coincide|nada que corregir/i);
  });

  it("si el formulario cuadra con el documento, sigue diciendo que ya coincide", () => {
    expect(puedeAplicarCorreccion(propuesta(), 1869)).toBe(false);
    expect(mensajeEstadoCorreccion(propuesta(), 1869)?.texto).toMatch(/ya coincide/i);
  });

  it("sin el importe del formulario el comportamiento no cambia", () => {
    expect(puedeAplicarCorreccion(propuesta())).toBe(false);
    expect(mensajeEstadoCorreccion(propuesta())?.texto).toMatch(/ya coincide/i);
  });

  it("sin OT no se aplica aunque el total no cuadre", () => {
    expect(puedeAplicarCorreccion(propuesta({ ots: [] }), 1793)).toBe(false);
  });
});
