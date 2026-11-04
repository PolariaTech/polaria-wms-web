import { describe, expect, it } from "vitest";
import { ESPERA_RELEER } from "../ot/aplicar-correccion-correo";
import { ESPERA_ABRIR_OV, ESPERA_GUARDAR_OV, ESPERA_IMPRIMIR_OV, esperaDeOv } from "./espera-ov";

describe("esperaDeOv", () => {
  it("al leer con IA dice que lee el pedido y usa el rango medido de releer", () => {
    expect(esperaDeOv({ isReadingIa: true, isEditing: false, isLoading: false, mateoBusyMessage: undefined })).toEqual({
      titulo: "Leyendo el pedido…",
      espera: ESPERA_RELEER,
    });
  });

  it("al abrir una OV guardada para editarla dice que la abre, en segundos, no que la lee", () => {
    expect(
      esperaDeOv({ isReadingIa: true, isEditing: true, isLoading: true, mateoBusyMessage: undefined }),
    ).toEqual({ titulo: "Abriendo el pedido…", espera: ESPERA_ABRIR_OV });
  });

  it("al guardar o emitir dice que guarda el pedido", () => {
    expect(esperaDeOv({ isReadingIa: false, isEditing: false, isLoading: false, mateoBusyMessage: undefined })).toEqual({
      titulo: "Guardando el pedido…",
      espera: ESPERA_GUARDAR_OV,
    });
  });

  it("si el envío puso un mensaje (imprimiendo), ese es el título", () => {
    expect(esperaDeOv({ isReadingIa: false, isEditing: false, isLoading: false, mateoBusyMessage: " Imprimiendo… " })).toEqual({
      titulo: "Imprimiendo…",
      espera: ESPERA_IMPRIMIR_OV,
    });
  });

  it("un mensaje vacío se ignora", () => {
    expect(esperaDeOv({ isReadingIa: true, isEditing: false, isLoading: false, mateoBusyMessage: "  " }).titulo).toBe(
      "Leyendo el pedido…",
    );
  });
});
