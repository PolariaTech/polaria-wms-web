import { describe, expect, it } from "vitest";
import {
  resolveCabeceraGuardada,
  resolveNotasGuardadas,
  resolveOccGuardada,
  usuarioBorroNotas,
} from "./resolve-cabecera-guardada";

describe("resolveOccGuardada (REQ-230)", () => {
  it("lo guardado manda sobre lo que propone el correo", () => {
    expect(
      resolveOccGuardada({
        guardada: "OCC-EDITADA-77",
        propuesta: "4501056534",
        origenTexto: "Oc Generada 4501056534",
      }),
    ).toBe("OCC-EDITADA-77");
  });

  it("respeta lo guardado aunque sea corto o alfanumérico", () => {
    expect(
      resolveOccGuardada({ guardada: "AB-12", propuesta: "4501056534" }),
    ).toBe("AB-12");
  });

  it("ignora espacios alrededor de lo guardado", () => {
    expect(
      resolveOccGuardada({ guardada: "  5017900  ", propuesta: "999999999" }),
    ).toBe("5017900");
  });

  it("si lo guardado es basura de OCR usa la propuesta limpia", () => {
    expect(
      resolveOccGuardada({
        guardada: "rAutorizado",
        propuesta: "4501056534",
        origenTexto: "",
      }),
    ).toBe("4501056534");
  });

  it("si lo guardado es basura y no hay propuesta, queda vacío", () => {
    expect(
      resolveOccGuardada({
        guardada: "rAutorizado",
        propuesta: "",
        origenTexto: "",
      }),
    ).toBe("");
  });

  it("sin nada guardado usa la propuesta del correo", () => {
    expect(
      resolveOccGuardada({ guardada: null, propuesta: "4501056534" }),
    ).toBe("4501056534");
    expect(resolveOccGuardada({ guardada: "", propuesta: "50179" })).toBe(
      "50179",
    );
  });
});

describe("usuarioBorroNotas (REQ-230)", () => {
  const filasVacias = [
    { "Notas generales": "" },
    { "Notas generales": "" },
  ];

  it("true si el usuario ya guardó la OV y las filas quedaron con notas vacías", () => {
    expect(
      usuarioBorroNotas({
        notasGuardadas: "",
        filasOrigen: filasVacias,
        observacionesGuardadas: "Fecha entrega: 2026-10-30",
      }),
    ).toBe(true);
  });

  it("false si todavía hay notas guardadas", () => {
    expect(
      usuarioBorroNotas({
        notasGuardadas: "Entregar antes de las 8",
        filasOrigen: filasVacias,
        observacionesGuardadas: "Fecha entrega: 2026-10-30",
      }),
    ).toBe(false);
  });

  it("false si la OV viene del correo y nadie la ha guardado (sin observaciones)", () => {
    expect(
      usuarioBorroNotas({
        notasGuardadas: "",
        filasOrigen: filasVacias,
        observacionesGuardadas: "",
      }),
    ).toBe(false);
  });

  it("false si alguna fila todavía trae notas del correo", () => {
    expect(
      usuarioBorroNotas({
        notasGuardadas: "",
        filasOrigen: [
          { "Notas generales": "" },
          { "Notas generales": "Horario 6 a 9" },
        ],
        observacionesGuardadas: "Fecha entrega: 2026-10-30",
      }),
    ).toBe(false);
  });

  it("false si las filas ni siquiera tienen la clave de notas", () => {
    expect(
      usuarioBorroNotas({
        notasGuardadas: "",
        filasOrigen: [{}, {}],
        observacionesGuardadas: "Fecha entrega: 2026-10-30",
      }),
    ).toBe(false);
  });

  it("false sin filas de origen", () => {
    expect(
      usuarioBorroNotas({
        notasGuardadas: "",
        filasOrigen: [],
        observacionesGuardadas: "Fecha entrega: 2026-10-30",
      }),
    ).toBe(false);
  });
});

describe("resolveCabeceraGuardada (REQ-230)", () => {
  const propuesta = {
    observaciones: "Notas generales del correo",
    ordenCompraHotel: "4501056534",
  };

  it("OV guardada con OCC y notas editadas: no se pisan con el correo", () => {
    expect(
      resolveCabeceraGuardada({
        detalle: {
          orden_compra_hotel: "OCC-EDITADA-77",
          notas_almacen: "Nota editada",
          observaciones: "Fecha entrega: 2026-10-30",
          origen_texto: "Oc Generada 4501056534",
        },
        filasOrigen: [{ "Notas generales": "Nota editada" }],
        propuesta,
      }),
    ).toEqual({
      observaciones: "Nota editada",
      ordenCompraHotel: "OCC-EDITADA-77",
    });
  });

  it("OV guardada con las notas borradas: siguen vacías", () => {
    expect(
      resolveCabeceraGuardada({
        detalle: {
          orden_compra_hotel: "OCC-EDITADA-77",
          notas_almacen: null,
          observaciones: "Fecha entrega: 2026-10-30",
          origen_texto: "Oc Generada 4501056534",
        },
        filasOrigen: [{ "Notas generales": "" }],
        propuesta,
      }).observaciones,
    ).toBe("");
  });

  it("OV recién llegada del correo: usa lo propuesto", () => {
    expect(
      resolveCabeceraGuardada({
        detalle: {
          orden_compra_hotel: null,
          notas_almacen: null,
          observaciones: null,
          origen_texto: "Oc Generada 4501056534",
        },
        filasOrigen: [{ "Notas generales": "Notas generales del correo" }],
        propuesta,
      }),
    ).toEqual({
      observaciones: "Notas generales del correo",
      ordenCompraHotel: "4501056534",
    });
  });
});

describe("resolveNotasGuardadas (REQ-230)", () => {
  it("las notas editadas y guardadas mandan sobre las del correo", () => {
    expect(
      resolveNotasGuardadas({
        notasGuardadas: "Nota editada por el usuario",
        propuesta: "Notas generales del correo",
        borradas: false,
      }),
    ).toBe("Nota editada por el usuario");
  });

  it("si el usuario las borró, no vuelven las del correo", () => {
    expect(
      resolveNotasGuardadas({
        notasGuardadas: "",
        propuesta: "Notas generales del correo",
        borradas: true,
      }),
    ).toBe("");
  });

  it("sin nada guardado ni borrado, usa la propuesta del correo", () => {
    expect(
      resolveNotasGuardadas({
        notasGuardadas: "",
        propuesta: "Notas generales del correo",
        borradas: false,
      }),
    ).toBe("Notas generales del correo");
  });
});
