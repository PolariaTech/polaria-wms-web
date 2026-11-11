import { describe, expect, it } from "vitest";
import type { OrigenCorreoRenglon } from "../origen/origen-correo-ordenes-trabajo";
import {
  aplicarSelloCabeceraAHijas,
  cabeceraUsuarioDesdeForm,
  leerCabeceraUsuarioSello,
  resolveCampoConSelloUsuario,
  sellarCabeceraUsuarioEnOrigen,
} from "./sellar-edicion-usuario-origen";

/**
 * Valores límite e inválidos del sello de cabecera (REQ-281), por campo.
 * Schema: schemas/schema_editar_pedido.md v1.7, fila «Cabecera sellada por el usuario».
 */

const CAMPOS_DEL_SELLO = [
  "notasGenerales",
  "centroConsumo",
  "referenciaPedido",
  "fechaEntrega",
  "direccionEntrega",
  "contacto",
  "telefono",
  "correo",
] as const;

const selloVacio = {
  notasGenerales: "",
  centroConsumo: "",
  referenciaPedido: "",
  fechaEntrega: "",
  direccionEntrega: "",
  contacto: "",
  telefono: "",
  correo: "",
};

const filaBase = { Producto: "Aguacate", Cantidad: 2 } as OrigenCorreoRenglon;

function filaConSelloCrudo(sello: unknown): OrigenCorreoRenglon {
  return { ...filaBase, _cabeceraUsuario: sello } as unknown as OrigenCorreoRenglon;
}

describe("sellarCabeceraUsuarioEnOrigen: valores límite por campo", () => {
  it.each(CAMPOS_DEL_SELLO)(
    "%s: recorta espacios al sellar",
    (campo) => {
      const filas = sellarCabeceraUsuarioEnOrigen([filaBase], {
        ...selloVacio,
        [campo]: "  valor  ",
      });
      expect(leerCabeceraUsuarioSello(filas)?.[campo]).toBe("valor");
    },
  );

  it.each(CAMPOS_DEL_SELLO)(
    "%s: un valor de solo espacios queda como vacío y se respeta",
    (campo) => {
      const filas = sellarCabeceraUsuarioEnOrigen([filaBase], {
        ...selloVacio,
        [campo]: "   \t ",
      });
      expect(leerCabeceraUsuarioSello(filas)?.[campo]).toBe("");
    },
  );

  it("no modifica las filas originales", () => {
    const original = { ...filaBase };
    sellarCabeceraUsuarioEnOrigen([original], { ...selloVacio, contacto: "Ana" });
    expect(original).toEqual(filaBase);
    expect(leerCabeceraUsuarioSello([original])).toBeNull();
  });
});

describe("leerCabeceraUsuarioSello: entradas inválidas", () => {
  it("sin filas devuelve null", () => {
    expect(leerCabeceraUsuarioSello([])).toBeNull();
  });

  it("filas sin sello devuelven null (pedido que aún no se guardó desde el formulario)", () => {
    expect(leerCabeceraUsuarioSello([filaBase, filaBase])).toBeNull();
  });

  it.each([
    ["null", null],
    ["texto", "no soy un objeto"],
    ["número", 42],
  ])("un sello %s se ignora", (_nombre, valor) => {
    expect(leerCabeceraUsuarioSello([filaConSelloCrudo(valor)])).toBeNull();
  });

  it("un sello sin claves devuelve todos los campos vacíos", () => {
    expect(leerCabeceraUsuarioSello([filaConSelloCrudo({})])).toEqual(selloVacio);
  });

  it("campos null o con otro tipo se convierten a texto sin romper", () => {
    const sello = leerCabeceraUsuarioSello([
      filaConSelloCrudo({ contacto: null, telefono: 9617995980, correo: undefined }),
    ]);
    expect(sello?.contacto).toBe("");
    expect(sello?.telefono).toBe("9617995980");
    expect(sello?.correo).toBe("");
  });

  it.each(CAMPOS_DEL_SELLO)("%s: recorta espacios al leer", (campo) => {
    const sello = leerCabeceraUsuarioSello([
      filaConSelloCrudo({ [campo]: "  x  " }),
    ]);
    expect(sello?.[campo]).toBe("x");
  });

  it("toma el primer renglón que trae sello", () => {
    const sello = leerCabeceraUsuarioSello([
      filaBase,
      filaConSelloCrudo({ contacto: "Primera" }),
      filaConSelloCrudo({ contacto: "Segunda" }),
    ]);
    expect(sello?.contacto).toBe("Primera");
  });
});

describe("cabeceraUsuarioDesdeForm: valores límite", () => {
  const form = {
    observaciones: "Entregar en andén 2",
    centroConsumo: "SUSHI",
    fechaEntrega: "2026-11-12",
    direccion: "Av. Prueba 100",
    contacto: "Ana Pérez",
    telefono: "9617995980",
    correo: "ana@empresa.example",
  };

  it("referencia nula o ausente queda vacía", () => {
    expect(cabeceraUsuarioDesdeForm({ ...form, referenciaPedido: null }).referenciaPedido).toBe("");
    expect(cabeceraUsuarioDesdeForm(form).referenciaPedido).toBe("");
  });

  it("recorta la referencia del pedido", () => {
    expect(
      cabeceraUsuarioDesdeForm({ ...form, referenciaPedido: "  OC-77  " }).referenciaPedido,
    ).toBe("OC-77");
  });

  it("pasa los demás campos tal cual (el recorte ocurre al sellar)", () => {
    const sello = cabeceraUsuarioDesdeForm({ ...form, referenciaPedido: "OC-77" });
    expect(sello).toEqual({
      notasGenerales: form.observaciones,
      centroConsumo: form.centroConsumo,
      referenciaPedido: "OC-77",
      fechaEntrega: form.fechaEntrega,
      direccionEntrega: form.direccion,
      contacto: form.contacto,
      telefono: form.telefono,
      correo: form.correo,
    });
  });
});

describe("resolveCampoConSelloUsuario: precedencia con valores límite", () => {
  it("sin sello, BD de solo espacios cae a la propuesta de Mateo recortada", () => {
    expect(
      resolveCampoConSelloUsuario({
        sello: null,
        key: "contacto",
        guardadoBd: "   ",
        propuestaMateo: "  Ana  ",
      }),
    ).toBe("Ana");
  });

  it("sin sello, con BD y Mateo vacíos devuelve vacío", () => {
    expect(
      resolveCampoConSelloUsuario({
        sello: null,
        key: "correo",
        guardadoBd: "",
        propuestaMateo: "",
      }),
    ).toBe("");
  });

  it("sin sello manda BD sobre Mateo", () => {
    expect(
      resolveCampoConSelloUsuario({
        sello: null,
        key: "direccionEntrega",
        guardadoBd: "Av. BD 1",
        propuestaMateo: "Av. Mateo 2",
      }),
    ).toBe("Av. BD 1");
  });

  it.each(CAMPOS_DEL_SELLO)(
    "%s: con sello vacío manda el vacío sobre BD y Mateo",
    (campo) => {
      expect(
        resolveCampoConSelloUsuario({
          sello: selloVacio,
          key: campo,
          guardadoBd: "dato BD",
          propuestaMateo: "dato Mateo",
        }),
      ).toBe("");
    },
  );
});

describe("aplicarSelloCabeceraAHijas: valores límite", () => {
  const hija = {
    almacen: "ALMACEN-MATEO",
    referenciaPedido: "REF-MATEO",
    fecha: "2026-11-10",
    responsableExterno: "Contacto Mateo",
    renglones: [{ Producto: "Aguacate", Cantidad: 1 } as OrigenCorreoRenglon],
  };

  it("con sello vacío, el almacén y el contacto quedan vacíos (el sello manda)", () => {
    const [resultado] = aplicarSelloCabeceraAHijas([hija], selloVacio);
    expect(resultado.almacen).toBe("");
    expect(resultado.responsableExterno).toBe("");
  });

  it("con referencia o fecha vacías en el sello conserva las de la hija", () => {
    const [resultado] = aplicarSelloCabeceraAHijas([hija], selloVacio);
    expect(resultado.referenciaPedido).toBe("REF-MATEO");
    expect(resultado.fecha).toBe("2026-11-10");
    expect(resultado.renglones[0].Fecha).toBe(undefined);
  });

  it("con referencia y fecha en el sello, ganan sobre las de la hija", () => {
    const [resultado] = aplicarSelloCabeceraAHijas([hija], {
      ...selloVacio,
      referenciaPedido: "OC-77",
      fechaEntrega: "2026-11-12",
    });
    expect(resultado.referenciaPedido).toBe("OC-77");
    expect(resultado.fecha).toBe("2026-11-12");
  });

  it("deja el sello en cada renglón y no modifica la hija original", () => {
    const sello = { ...selloVacio, contacto: "Ana" };
    const [resultado] = aplicarSelloCabeceraAHijas([hija], sello);
    expect(leerCabeceraUsuarioSello(resultado.renglones)?.contacto).toBe("Ana");
    expect(hija.almacen).toBe("ALMACEN-MATEO");
    expect(leerCabeceraUsuarioSello(hija.renglones)).toBeNull();
  });

  it("sin hijas devuelve una lista vacía", () => {
    expect(aplicarSelloCabeceraAHijas([], selloVacio)).toEqual([]);
  });
});
