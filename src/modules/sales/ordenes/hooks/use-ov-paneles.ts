import { useCallback, useEffect, useRef, useState } from "react";
import { useShellOverlayStore } from "@/stores/shell-overlay.store";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { CypherCompanionOtPicker } from "../components/modals/OrdenVentaCypherDrawer";
import {
  resolveCreateCypherTarget,
  shouldClearCypherOnCreateClose,
} from "../components/pages/ov-create-draft-session";
import { cypherMatchesCreateDraft } from "../components/pages/ov-listado-chrome";
import { useOvEditLockSession } from "./use-ov-edit-lock-session";

/**
 * Qué paneles de una OV hay abiertos (formulario, detalle, Cypher) y cómo se enlazan entre
 * sí: soft-lock de edición (REQ-180) y bloqueo del launcher de Mateo mientras hay Cypher.
 */
export function useOvPaneles({
  codigoCuenta,
  inspect,
  reload,
}: {
  codigoCuenta: string | null;
  inspect: boolean;
  reload: () => Promise<unknown>;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createDraftId, setCreateDraftId] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [cypherId, setCypherId] = useState<string | null>(null);
  const [companionIdComprador, setCompanionIdComprador] = useState<string | null>(null);
  const [companionOtPicker, setCompanionOtPicker] =
    useState<CypherCompanionOtPicker | null>(null);
  /** REQ-188: OV cuyo chat «Modificar con IA» se abre al cargar el formulario. */
  const [reagruparAlAbrirId, setReagruparAlAbrirId] = useState<string | null>(null);
  /** El formulario lo abrió el Cypher («Editar» o «Modificar con IA»): si el Cypher se cierra, se cierra con él. */
  const formularioDelCypherRef = useRef(false);
  const editLock = useOvEditLockSession({
    codigoCuenta,
    isCreateOpen,
    editingId,
    inspect,
  });
  const setCypherOpen = useShellOverlayStore((s) => s.setCypherOpen);
  const setOvEditOpen = useShellOverlayStore((s) => s.setOvEditOpen);

  // Mateo oculta el launcher flotante mientras Cypher está abierto.
  useEffect(() => {
    setCypherOpen(Boolean(cypherId));
    return () => setCypherOpen(false);
  }, [cypherId, setCypherOpen]);

  // REQ-149: bloquear Mateo IA SSO mientras el modal de OV está abierto.
  useEffect(() => {
    const blocking = Boolean(isCreateOpen && !inspect);
    setOvEditOpen(blocking);
    return () => setOvEditOpen(false);
  }, [isCreateOpen, inspect, setOvEditOpen]);

  const limpiarReagruparAlAbrir = useCallback(
    () => setReagruparAlAbrirId(null),
    [],
  );

  const companionWithCypher = Boolean(
    !inspect &&
      ((isCreateOpen &&
        cypherMatchesCreateDraft({ cypherId, editingId, createDraftId })) ||
        Boolean(cypherId && detalleId && detalleId === cypherId)),
  );

  /** Cierra el formulario; `volverAlDetalle` reabre el detalle de la OV editada (no si se cierra con el Cypher). */
  const cerrarFormulario = (volverAlDetalle: boolean) => {
    const closingId = resolveCreateCypherTarget(editingId, createDraftId);
    const editedId = editingId;
    // REQ-180: liberar soft-lock ya (no esperar stale) y refrescar badge del listado.
    void editLock.releaseCurrent(editedId).finally(() => {
      void reload();
    });
    formularioDelCypherRef.current = false;
    setIsCreateOpen(false);
    setEditingId(null);
    setCreateDraftId(null);
    setReagruparAlAbrirId(null);
    setCompanionOtPicker(null);
    setCompanionIdComprador(null);
    editLock.resetLockUi();
    if (shouldClearCypherOnCreateClose({ cypherId, closingId })) {
      setCypherId(null);
    }
    if (volverAlDetalle && editedId) setDetalleId(editedId);
  };

  const abrirNuevaVenta = () => {
    if (!codigoCuenta) return;
    editLock.resetLockUi();
    setEditingId(null);
    setCreateDraftId(null);
    setIsCreateOpen(true);
  };

  const alClickFila = (row: OrdenVentaOperadorRow) => {
    // REQ-255: cancelada → solo detalle (lectura).
    if (row.estado === "cancelada") {
      setCypherId(null);
      setDetalleId(row.idOrdenVenta);
      return;
    }
    // OV por_confirmar: formulario + Cypher juntos (REQ-180: soft-lock).
    if (!inspect && row.estado === "por_confirmar") {
      const id = row.idOrdenVenta;
      void editLock.prepareOpenEdit(id).then(() => {
        setDetalleId(null);
        setEditingId(id);
        setCreateDraftId(null);
        setIsCreateOpen(true);
        setCypherId(id);
      });
      return;
    }
    setCypherId(null);
    setDetalleId(row.idOrdenVenta);
  };

  return {
    isCreateOpen,
    setIsCreateOpen,
    editingId,
    setEditingId,
    createDraftId,
    setCreateDraftId,
    detalleId,
    setDetalleId,
    cypherId,
    setCypherId,
    companionIdComprador,
    setCompanionIdComprador,
    companionOtPicker,
    setCompanionOtPicker,
    reagruparAlAbrirId,
    setReagruparAlAbrirId,
    limpiarReagruparAlAbrir,
    formularioDelCypherRef,
    editLock,
    companionWithCypher,
    cerrarFormulario,
    abrirNuevaVenta,
    alClickFila,
  };
}

export type OvPaneles = ReturnType<typeof useOvPaneles>;
