import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ESPERA_RELEER } from "../../utils/ot/aplicar-correccion-correo";
import { CargaConPolo } from "./OrdenVentaCorreccionCorreoPanel";

describe("CargaConPolo: fondo", () => {
  it("difumina lo que pasa detrás para que no se lean modales ni cambios de página", () => {
    render(<CargaConPolo titulo="Releyendo el correo…" espera={ESPERA_RELEER} />);

    // La capa va en un portal a `body`, por eso se busca ahí y no en el contenedor del render.
    const capa = document.body.querySelector<HTMLElement>('[aria-modal="true"]')!.parentElement!;

    expect(capa.className).toContain("fixed");
    expect(capa.className).toContain("inset-0");
    expect(capa.className).toContain("bg-polaria-bg/85");
    expect(capa.className).toContain("backdrop-blur-md");
  });
});
