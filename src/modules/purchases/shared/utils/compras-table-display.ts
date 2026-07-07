const DEFAULT_MAX_PRODUCTOS_TABLA = 2;

export function resumirProductosTabla(
  nombres: readonly string[],
  maxVisible = DEFAULT_MAX_PRODUCTOS_TABLA,
): string {
  const items = nombres.map((name) => name.trim()).filter(Boolean);

  if (!items.length) {
    return "—";
  }

  if (items.length <= maxVisible) {
    return items.join(" · ");
  }

  return `${items.slice(0, maxVisible).join(" · ")}…`;
}

export function tieneMasProductosTabla(
  nombres: readonly string[],
  maxVisible = DEFAULT_MAX_PRODUCTOS_TABLA,
): boolean {
  return nombres.map((name) => name.trim()).filter(Boolean).length > maxVisible;
}
