import { describe, expect, it } from "vitest";
import {
  CAMINOS,
  INITIAL_FORM,
  formFromImpresora,
} from "./impresora-create-modal.constants";
import type { ImpresoraListRow } from "@/modules/configurator/impresoras/services/impresoras.service";

describe("impresora-create-modal.constants", () => {
  it("expone los tres caminos de impresión", () => {
    expect(CAMINOS.map((c) => c.id)).toEqual(["qz", "brother_email", "epson_connect"]);
  });

  it("mapea una impresora existente al formulario", () => {
    const form = formFromImpresora({
      nombre: "Oficina",
      codigoCuenta: "ACME",
      pais: "CO",
      modoEnvio: "email",
      nombreSistema: null,
      emailDestino: "x@print.brother.com",
    } as unknown as ImpresoraListRow);

    expect(form).toMatchObject({
      nombre: "Oficina",
      codigoCuenta: "ACME",
      pais: "CO",
      nombreSistema: "",
      emailDestino: "x@print.brother.com",
    });
    expect(INITIAL_FORM.camino).toBe("qz");
  });
});
