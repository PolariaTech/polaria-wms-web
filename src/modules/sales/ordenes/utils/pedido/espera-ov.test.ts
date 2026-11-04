import { describe, expect, it } from "vitest";
import { ESPERA_RELEER } from "../ot/aplicar-correccion-correo";
import { ESPERA_GUARDAR_OV, ESPERA_IMPRIMIR_OV, esperaDeOv } from "./espera-ov";

describe("esperaDeOv", () => {
  it("al leer con IA dice que lee el pedido y usa el rango medido de releer", () => {
    expect(esperaDeOv({ isReadingIa: true, mateoBusyMessage: undefined })).toEqual({
      titulo: "Leyendo el pedido…",
      espera: ESPERA_RELEER,
    });
  });

  it("al guardar o emitir dice que guarda el pedido", () => {
    expect(esperaDeOv({ isReadingIa: false, mateoBusyMessage: undefined })).toEqual({
      titulo: "Guardando el pedido…",
      espera: ESPERA_GUARDAR_OV,
    });
  });

  it("si el envío puso un mensaje (imprimiendo), ese es el título", () => {
    expect(esperaDeOv({ isReadingIa: false, mateoBusyMessage: " Imprimiendo… " })).toEqual({
      titulo: "Imprimiendo…",
      espera: ESPERA_IMPRIMIR_OV,
    });
  });

  it("un mensaje vacío se ignora", () => {
    expect(esperaDeOv({ isReadingIa: true, mateoBusyMessage: "  " }).titulo).toBe(
      "Leyendo el pedido…",
    );
  });
});
