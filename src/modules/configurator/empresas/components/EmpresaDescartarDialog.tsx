"use client";

import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";

interface EmpresaDescartarDialogProps {
  open: boolean;
  onSalir: () => void;
  onSeguir: () => void;
}

export function EmpresaDescartarDialog({
  open,
  onSalir,
  onSeguir,
}: EmpresaDescartarDialogProps) {
  return (
    <PolariaConfirmDialog
      open={open}
      stackLevel="nested"
      title="Hay datos sin guardar."
      confirmLabel="Salir"
      cancelLabel="Seguir editando"
      onConfirm={onSalir}
      onClose={onSeguir}
    />
  );
}
