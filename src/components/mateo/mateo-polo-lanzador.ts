/**
 * El botón flotante de Mateo Soporte vive dentro del shadow DOM del bundle `mateo-widget.js` (que
 * se genera en otro repo), así que su icono no se puede cambiar desde aquí con opciones. El shadow
 * root es abierto: se le agrega una hoja de estilos que cambia el copo por Polo en «calma»
 * (marca/ilustraciones/personajes), igual que en el isotipo exportado: Polo teal sobre la pastilla
 * oscura del botón.
 *
 * Solo actúa con el botón cerrado («Abrir chat de soporte»). Si el widget cambia ese texto o su
 * estructura, la regla deja de aplicar y se ve el icono original: el chat sigue funcionando.
 */
const ICONO_POLO = "/assets/polo-calma-teal.svg";

/** Polo ocupa ~57 % de la pastilla en el isotipo exportado; el SVG lo dibuja al 87 % de su caja. */
const LADO_ICONO_PX = 39;

const BOTON_CERRADO = '#chat-button[aria-label="Abrir chat de soporte"]';

export const ESTILO_POLO_LANZADOR = `
${BOTON_CERRADO} > div.shrink-0 { display: none !important; }
${BOTON_CERRADO}::after {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: ${LADO_ICONO_PX}px;
  height: ${LADO_ICONO_PX}px;
  background: url(${ICONO_POLO}) center / contain no-repeat;
  pointer-events: none;
}
`;

/**
 * Pone a Polo en el botón del widget montado en `host`. Si el widget vuelve a dibujar y quita la
 * hoja, la repone. Devuelve la función que lo deshace. Sin shadow root abierto no hace nada.
 */
export function aplicarPoloAlLanzador(host: HTMLElement | null): () => void {
  const raiz = host?.shadowRoot;
  if (!raiz) return () => undefined;

  const estilo = document.createElement("style");
  estilo.dataset.polariaPolo = "";
  estilo.textContent = ESTILO_POLO_LANZADOR;
  raiz.appendChild(estilo);

  const vigilante = new MutationObserver(() => {
    if (!estilo.isConnected) raiz.appendChild(estilo);
  });
  vigilante.observe(raiz, { childList: true });

  return () => {
    vigilante.disconnect();
    estilo.remove();
  };
}
