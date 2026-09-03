import { describe, expect, it } from "vitest";
import { emptyCompradorAltaFicha } from "@/modules/admin-panel/compradores/utils/comprador-alta";
import { buildOrdenVentaPrefillFromComprador } from "./prefill-orden-venta-from-comprador";

describe("buildOrdenVentaPrefillFromComprador", () => {
  it("copia entrega, ventana, moneda y políticas del primer centro y contacto", () => {
    const ficha = emptyCompradorAltaFicha();
    ficha.moneda = "USD";
    ficha.exigeOc = "Sí";
    ficha.sustituciones = "Sí, con aviso";
    ficha.requiereLote = "Sí";
    ficha.requiereTemp = "No";
    ficha.requiereFicha = "Sí";
    ficha.tolerancia = "±3 %";
    ficha.vidaUtil = "3";
    ficha.politicaDevolucion = "No se aceptan devoluciones de perecederos";
    ficha.whatsapp = "+5219980000000";
    ficha.centros = [
      {
        nombre: "Cocina central",
        dias: "Lun a Vie",
        direccion: "Km 250 Carretera Federal",
        cp: "77710",
        anden: "Andén 4",
        desde: "06:00",
        hasta: "09:00",
        contacto: "Recepcionista almacén",
        telefono: "+5219981111111",
        carreteraFederal: "307",
        notas: "Avisar 20 min antes",
      },
    ];
    ficha.contactos = [
      {
        nombre: "Compras hotel",
        puesto: "Compras",
        rol: "Quien pide",
        telefono: "+5219982222222",
        correo: "compras@hotel.com",
      },
    ];

    expect(buildOrdenVentaPrefillFromComprador({ ficha })).toEqual({
      moneda: "USD",
      centroConsumo: "Cocina central",
      ventanaDesde: "06:00",
      ventanaHasta: "09:00",
      direccion: "Km 250 Carretera Federal · CP 77710 · 307",
      anden: "Andén 4",
      contacto: "Recepcionista almacén",
      telefono: "+5219981111111",
      aceptaSustituciones: "Sí, con aviso",
      requiereLote: "Sí",
      registrarTemperatura: "No",
      observaciones:
        "Avisar 20 min antes\nTolerancia de peso: ±3 %\nVida útil mínima al entregar: 3 días\nRequiere ficha técnica del producto\nRechazo / devolución: No se aceptan devoluciones de perecederos",
      exigeOc: true,
    });
  });

  it("usa el contacto y teléfono del comprador si el centro no los trae", () => {
    const ficha = emptyCompradorAltaFicha();
    ficha.contactos = [
      {
        nombre: "Chef ejecutivo",
        puesto: "Cocina",
        rol: "Quien recibe",
        telefono: "+5219983333333",
        correo: "",
      },
    ];

    const prefill = buildOrdenVentaPrefillFromComprador({
      ficha,
      telefonoComprador: "+5219984444444",
    });

    expect(prefill.contacto).toBe("Chef ejecutivo");
    expect(prefill.telefono).toBe("+5219983333333");
    expect(prefill.moneda).toBe("MXN");
    expect(prefill.exigeOc).toBe(false);
  });

  it("no inventa políticas ni dirección si la ficha está vacía", () => {
    const prefill = buildOrdenVentaPrefillFromComprador({
      ficha: emptyCompradorAltaFicha(),
    });

    expect(prefill).toEqual({
      moneda: "MXN",
      centroConsumo: "",
      ventanaDesde: "",
      ventanaHasta: "",
      direccion: "",
      anden: "",
      contacto: "",
      telefono: "",
      aceptaSustituciones: "",
      requiereLote: "",
      registrarTemperatura: "",
      observaciones: "",
      exigeOc: false,
    });
  });
});
