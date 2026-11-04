/** REQ-226: oculta el título vacío del DataTable y empuja la toolbar a la derecha. */
export const OV_LISTADO_DATATABLE_CHROME_CLASS =
  "[&>header>div:first-child]:hidden [&>header]:justify-end";

export function cypherMatchesCreateDraft(params: {
  cypherId: string | null;
  editingId: string | null;
  createDraftId: string | null;
}): boolean {
  const { cypherId, editingId, createDraftId } = params;
  if (!cypherId) return false;
  return (
    (Boolean(editingId) && editingId === cypherId) ||
    (Boolean(createDraftId) && createDraftId === cypherId)
  );
}
