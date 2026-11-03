import { useEffect, type KeyboardEvent } from "react";

/** Un input type=time se queda el foco en hora, minutos y AM/PM. Un Tab sale del campo. */
export function salirDeHoraConTab(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key !== "Tab") return;
  const dialog = event.currentTarget.closest('[role="dialog"]');
  if (!dialog) return;
  const focusables = Array.from(
    dialog.querySelectorAll<HTMLElement>("button, input, select, textarea"),
  ).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.tabIndex >= 0 &&
      !el.closest("[hidden], [aria-hidden='true']"),
  );
  const index = focusables.indexOf(event.currentTarget);
  const destino = focusables[index + (event.shiftKey ? -1 : 1)];
  if (index < 0 || !destino) return;
  event.preventDefault();
  destino.focus();
}

export function useFocoOrdenCompraAlAbrir(
  open: boolean,
  step: string,
  isLoading: boolean,
) {
  useEffect(() => {
    if (!open || step !== "form" || isLoading) return;
    document.getElementById("orden-venta-oc-hotel")?.focus();
  }, [open, step, isLoading]);
}
