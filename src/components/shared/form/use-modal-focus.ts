import { useEffect, useRef, type RefObject } from "react";

const SELECTOR_CICLO =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SELECTOR_MODAL = '[role="dialog"], [role="alertdialog"]';

function estaVisibleYHabilitado(nodo: HTMLElement): boolean {
  if (nodo.hasAttribute("disabled")) return false;
  if (nodo.getAttribute("aria-disabled") === "true") return false;
  if (nodo.hidden || nodo.closest("[hidden]")) return false;
  if (nodo.closest("[aria-hidden='true']")) return false;
  const estilo = window.getComputedStyle(nodo);
  return estilo.visibility !== "hidden" && estilo.display !== "none";
}

function dialogoMasCercano(nodo: HTMLElement): HTMLElement | null {
  const dialogo = nodo.closest(SELECTOR_MODAL);
  return dialogo instanceof HTMLElement ? dialogo : null;
}

function enfocablesDelDialogo(dialogo: HTMLElement): HTMLElement[] {
  return [...dialogo.querySelectorAll<HTMLElement>(SELECTOR_CICLO)].filter(
    (nodo) =>
      estaVisibleYHabilitado(nodo) && dialogoMasCercano(nodo) === dialogo,
  );
}

function esModalDeMasArriba(dialogo: HTMLElement): boolean {
  const modales = document.querySelectorAll('[aria-modal="true"]');
  return modales[modales.length - 1] === dialogo;
}

function elementoActivo(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
}

function atraparTab(event: KeyboardEvent, dialogo: HTMLElement): void {
  if (event.key !== "Tab" || event.defaultPrevented) return;
  if (!esModalDeMasArriba(dialogo)) return;

  const activo = elementoActivo();
  if (!activo || !dialogo.contains(activo)) {
    if (activo == null || activo === document.body) {
      event.preventDefault();
      dialogo.focus();
    }
    return;
  }

  const ciclo = enfocablesDelDialogo(dialogo);
  const primero = ciclo[0];
  const ultimo = ciclo[ciclo.length - 1];
  if (!primero || !ultimo) {
    event.preventDefault();
    dialogo.focus();
    return;
  }
  // Recién abierto el foco está en el propio diálogo, que no cuenta en el ciclo.
  if (activo === dialogo) {
    event.preventDefault();
    (event.shiftKey ? ultimo : primero).focus();
    return;
  }
  if (!event.shiftKey && activo === ultimo) {
    event.preventDefault();
    primero.focus();
    return;
  }
  if (event.shiftKey && activo === primero) {
    event.preventDefault();
    ultimo.focus();
  }
}

function guardarElementoActivo(destino: { current: HTMLElement | null }): void {
  const activo = document.activeElement;
  if (activo instanceof HTMLElement) destino.current = activo;
}

function enfocarAlAbrir(
  dialogo: HTMLElement,
  previoRef: { current: HTMLElement | null },
): void {
  const focoActual = document.activeElement;
  if (focoActual instanceof HTMLElement && dialogo.contains(focoActual)) {
    return;
  }
  if (focoActual instanceof HTMLElement) previoRef.current = focoActual;
  dialogo.focus();
}

function restaurarFoco(previo: HTMLElement | null): void {
  if (previo && document.contains(previo)) previo.focus();
}

export function useModalFocus(
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>,
): void {
  const previoRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) return;
    guardarElementoActivo(previoRef);
    const alEnfocar = () => guardarElementoActivo(previoRef);
    document.addEventListener("focusin", alEnfocar);
    return () => document.removeEventListener("focusin", alEnfocar);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dialogo = dialogRef.current;
    if (!dialogo) return;
    enfocarAlAbrir(dialogo, previoRef);
    const previo = previoRef.current;
    const alTeclear = (event: KeyboardEvent) => atraparTab(event, dialogo);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      restaurarFoco(previo);
    };
  }, [dialogRef, open]);
}
