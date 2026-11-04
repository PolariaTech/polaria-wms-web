/** REQ-199: id del borrador tras leer archivo (sin pasar a modo edición). */

export function resolveCreateCypherTarget(
  editingId: string | null,
  createDraftId: string | null,
): string | null {
  return editingId ?? createDraftId;
}

export function shouldClearCypherOnCreateClose(params: {
  cypherId: string | null;
  closingId: string | null;
}): boolean {
  const { cypherId, closingId } = params;
  return Boolean(cypherId && closingId && cypherId === closingId);
}
