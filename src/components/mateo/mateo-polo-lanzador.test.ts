import { afterEach, describe, expect, it } from "vitest";
import { aplicarPoloAlLanzador, ESTILO_POLO_LANZADOR } from "./mateo-polo-lanzador";

function anfitrion(conShadow = true): HTMLElement {
  const host = document.createElement("div");
  if (conShadow) host.attachShadow({ mode: "open" });
  document.body.appendChild(host);
  return host;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("aplicarPoloAlLanzador", () => {
  it("agrega la hoja de estilos al shadow root del widget", () => {
    const host = anfitrion();

    aplicarPoloAlLanzador(host);

    const estilo = host.shadowRoot!.querySelector("style[data-polaria-polo]");
    expect(estilo?.textContent).toBe(ESTILO_POLO_LANZADOR);
  });

  it("cambia el icono solo con el botón cerrado y usa el Polo «calma» teal", () => {
    expect(ESTILO_POLO_LANZADOR).toContain('#chat-button[aria-label="Abrir chat de soporte"]');
    expect(ESTILO_POLO_LANZADOR).toContain("/assets/polo-calma-teal.svg");
    // Esconde el icono original (el único hijo con shrink-0) y no toca el resto del botón.
    expect(ESTILO_POLO_LANZADOR).toContain("> div.shrink-0 { display: none !important; }");
    expect(ESTILO_POLO_LANZADOR).toContain("pointer-events: none");
  });

  it("al deshacerlo quita la hoja y deja de vigilar", () => {
    const host = anfitrion();
    const deshacer = aplicarPoloAlLanzador(host);

    deshacer();

    expect(host.shadowRoot!.querySelector("style[data-polaria-polo]")).toBeNull();
  });

  it("si el widget quita la hoja al volver a dibujar, la repone", async () => {
    const host = anfitrion();
    aplicarPoloAlLanzador(host);

    host.shadowRoot!.querySelector("style[data-polaria-polo]")!.remove();
    await Promise.resolve();

    expect(host.shadowRoot!.querySelector("style[data-polaria-polo]")).not.toBeNull();
  });

  it("después de deshacerlo ya no la repone", async () => {
    const host = anfitrion();
    const deshacer = aplicarPoloAlLanzador(host);
    deshacer();

    host.shadowRoot!.appendChild(document.createElement("div"));
    await Promise.resolve();

    expect(host.shadowRoot!.querySelector("style[data-polaria-polo]")).toBeNull();
  });

  it("sin shadow root o sin anfitrión no hace nada ni falla", () => {
    expect(() => aplicarPoloAlLanzador(anfitrion(false))()).not.toThrow();
    expect(() => aplicarPoloAlLanzador(null)()).not.toThrow();
  });
});
