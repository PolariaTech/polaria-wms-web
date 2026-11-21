import { describe, expect, it } from "vitest";
import type { OrigenCorreoRenglon } from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  aplicarCabeceraFormAOrdenesTrabajo,
  aplicarCabeceraFormARenglonActivo,
  aplicarCabeceraOvARenglonHermano,
  propagarCabeceraOvATodasLasHijas,
} from "./sync-ot-cabecera-renglon";

const base: OrigenCorreoRenglon = {
  Producto: "TOMATE",
  Cantidad: 10,
  Unidad: "KGS",
  Almacen: "COCINA A",
  "Numero pedido": "OC-OLD",
  Fecha: "2026-01-10",
  "Responsable externo": "Ana",
  "Telefono contacto": "555111",
  "Correo contacto": "ana@old.com",
  "Direccion entrega": "Calle Vieja 1",
  Destino: "Calle Vieja 1",
  Anden: "A1",
  "Ventana desde": "08:00",
  "Ventana hasta": "10:00",
  "Notas generales": "Notas viejas",
  Prioridad: "Normal",
};

describe("aplicarCabeceraFormARenglonActivo (REQ-281)", () => {
  it("persiste vacío del form (no deja el valor viejo del origen)", () => {
    const next = aplicarCabeceraFormARenglonActivo(base, {
      almacen: "COCINA B",
      numeroPedido: "OC-NEW",
      fecha: "2026-03-01",
      responsableExterno: "",
      telefonoOt: "",
      correoOt: "",
      direccionOt: "",
      andenOt: "B2",
      ventanaDesdeOt: "09:00",
      ventanaHastaOt: "11:00",
      notasOt: "",
      prioridadOt: "Urgente",
    });
    expect(next["Responsable externo"]).toBe("");
    expect(next["Telefono contacto"]).toBe("");
    expect(next["Correo contacto"]).toBe("");
    expect(next["Direccion entrega"]).toBe("");
    expect(next.Destino).toBe("");
    expect(next["Notas generales"]).toBe("");
    expect(next.Almacen).toBe("COCINA B");
    expect(next["Numero pedido"]).toBe("OC-NEW");
  });

  it("limpia OC basura OCR cuando el form no trae número", () => {
    const conBasura: OrigenCorreoRenglon = {
      ...base,
      "Numero pedido": "rAutorizado",
    };
    const next = aplicarCabeceraFormARenglonActivo(conBasura, {
      almacen: "COCINA A",
      numeroPedido: "",
      fecha: "",
      responsableExterno: "Ana",
      telefonoOt: "555",
      correoOt: "a@b.c",
      direccionOt: "X",
      andenOt: "",
      ventanaDesdeOt: "",
      ventanaHastaOt: "",
      notasOt: "n",
      prioridadOt: "",
    });
    expect(next["Numero pedido"]).toBe("");
  });
});

describe("aplicarCabeceraOvARenglonHermano (REQ-281)", () => {
  it("propaga vacío de cabecera OV a OT hermanas", () => {
    const next = aplicarCabeceraOvARenglonHermano(base, {
      notasOt: "",
      direccionOt: "",
      telefonoOt: "",
      correoOt: "",
      responsableExterno: "",
    });
    expect(next["Notas generales"]).toBe("");
    expect(next["Direccion entrega"]).toBe("");
    expect(next.Destino).toBe("");
    expect(next["Telefono contacto"]).toBe("");
    expect(next["Correo contacto"]).toBe("");
    expect(next["Responsable externo"]).toBe("");
    expect(next.Almacen).toBe("COCINA A");
  });

  it("REQ-337: propaga la fecha de cabecera a OT hermanas", () => {
    const next = aplicarCabeceraOvARenglonHermano(base, {
      notasOt: "n",
      direccionOt: "d",
      telefonoOt: "",
      correoOt: "",
      responsableExterno: "",
      fecha: "2099-06-01",
    });
    expect(next.Fecha).toBe("2099-06-01");
  });

  it("REQ-374: al paginar no pisa la fecha del renglón hermano", () => {
    const next = aplicarCabeceraOvARenglonHermano(
      base,
      {
        notasOt: "n",
        direccionOt: "d",
        telefonoOt: "",
        correoOt: "",
        responsableExterno: "",
        fecha: "2099-06-01",
      },
      { propagarFechaOv: false },
    );
    expect(next.Fecha).toBe("2026-01-10");
  });
});

describe("aplicarCabeceraFormAOrdenesTrabajo (REQ-337 / REQ-374)", () => {
  const cabeceraActiva = {
    almacen: "COCINA A",
    numeroPedido: "OC-A",
    fecha: "2099-06-01",
    responsableExterno: "Ana",
    telefonoOt: "",
    correoOt: "",
    direccionOt: "",
    andenOt: "",
    ventanaDesdeOt: "",
    ventanaHastaOt: "",
    notasOt: "",
    prioridadOt: "",
  };

  const tresHijas = () => [
    {
      id: "ot-a",
      label: "A",
      numeroPedido: "OC-A",
      almacen: "COCINA A",
      referenciaPedido: "",
      fecha: "2026-01-10",
      responsableExterno: "Ana",
      renglones: [{ ...base, Almacen: "COCINA A", Fecha: "2026-01-10" }],
      totalCantidad: 1,
    },
    {
      id: "ot-b",
      label: "B",
      numeroPedido: "OC-B",
      almacen: "COCINA B",
      referenciaPedido: "",
      fecha: "2026-02-10",
      responsableExterno: "Luis",
      renglones: [
        {
          ...base,
          Almacen: "COCINA B",
          Fecha: "2026-02-10",
          "Notas generales": "b",
        },
      ],
      totalCantidad: 1,
    },
    {
      id: "ot-c",
      label: "C",
      numeroPedido: "OC-C",
      almacen: "COCINA C",
      referenciaPedido: "",
      fecha: "2026-03-10",
      responsableExterno: "Eva",
      renglones: [
        {
          ...base,
          Almacen: "COCINA C",
          Fecha: "2026-03-10",
          "Notas generales": "c",
        },
      ],
      totalCantidad: 1,
    },
  ];

  it("al guardar (default) propaga fecha a hermanas", () => {
    const next = aplicarCabeceraFormAOrdenesTrabajo(
      tresHijas(),
      "ot-a",
      cabeceraActiva,
    );
    expect(next[1]?.fecha).toBe("2099-06-01");
    expect(next[2]?.fecha).toBe("2099-06-01");
    expect(next[1]?.almacen).toBe("COCINA B");
    expect(next[2]?.almacen).toBe("COCINA C");
  });

  it("al paginar no propaga fecha ni homogeniza almacenes", () => {
    const next = aplicarCabeceraFormAOrdenesTrabajo(
      tresHijas(),
      "ot-a",
      cabeceraActiva,
      { propagarFechaOv: false },
    );
    expect(next[0]?.fecha).toBe("2099-06-01");
    expect(next[1]?.fecha).toBe("2026-02-10");
    expect(next[2]?.fecha).toBe("2026-03-10");
    expect(next[1]?.almacen).toBe("COCINA B");
    expect(next[2]?.almacen).toBe("COCINA C");
    expect(next[1]?.renglones[0]?.Fecha).toBe("2026-02-10");
  });
});

describe("propagarCabeceraOvATodasLasHijas (REQ-141)", () => {
  it("limpia notas en todas las OT aunque no haya OT activa/pager", () => {
    const hijas = [
      {
        id: "ot-1",
        label: "1",
        numeroPedido: "A",
        almacen: "COCINA A",
        referenciaPedido: "",
        fecha: "",
        responsableExterno: "Ana",
        renglones: [{ ...base }],
        totalCantidad: 1,
      },
      {
        id: "ot-2",
        label: "2",
        numeroPedido: "B",
        almacen: "COCINA B",
        referenciaPedido: "",
        fecha: "",
        responsableExterno: "Luis",
        renglones: [
          {
            ...base,
            Almacen: "COCINA B",
            "Notas generales": "otras notas",
          },
        ],
        totalCantidad: 1,
      },
    ];
    const next = propagarCabeceraOvATodasLasHijas(hijas, {
      notasOt: "",
      direccionOt: "",
      telefonoOt: "",
      correoOt: "",
      responsableExterno: "",
      fecha: "2099-06-01",
    });
    expect(next[0]?.renglones[0]?.["Notas generales"]).toBe("");
    expect(next[1]?.renglones[0]?.["Notas generales"]).toBe("");
    expect(next[0]?.almacen).toBe("COCINA A");
    expect(next[1]?.almacen).toBe("COCINA B");
    expect(next[0]?.fecha).toBe("2099-06-01");
    expect(next[1]?.fecha).toBe("2099-06-01");
    expect(next[0]?.renglones[0]?.Fecha).toBe("2099-06-01");
    expect(next[1]?.renglones[0]?.Fecha).toBe("2099-06-01");
  });
});
