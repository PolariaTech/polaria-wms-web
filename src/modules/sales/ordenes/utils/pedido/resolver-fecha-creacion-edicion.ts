export function resolverFechaCreacionEdicion(
  createdAt: string | null | undefined,
  fechaPedido: string | null | undefined,
): string {
  return createdAt || fechaPedido || "";
}
