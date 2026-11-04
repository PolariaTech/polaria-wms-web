import { useRef } from "react";
import type { RevisionPendiente } from "../utils/ot/por-confirmar-revision-alert";

/**
 * Las refs que el modal de OV comparte con sus hooks (selección de cliente, envío, sembrado de
 * líneas, scroll del formulario). Viven aquí y no en el componente: el modal las junta con el
 * resto del estado en un solo objeto que va mutando, y `react-hooks/refs` marca ese objeto entero
 * si las `useRef` se declaran en el mismo componente. Los valores iniciales y el orden son los
 * mismos de antes: el cambio no altera el comportamiento.
 */
export function useRefsOv() {
  const selectedCompradorIdRef = useRef("");
  const skipDiscrepanciaConfirmRef = useRef(false);
  const skipSaveConfirmRef = useRef(false);
  /** `draft` = icono disco (sigue Por confirmar); `emit` = Confirmar → Confirmada (REQ-133). */
  const submitIntentRef = useRef<"emit" | "draft">("emit");
  const docsFileInputRef = useRef<HTMLInputElement | null>(null);
  const bootstrapPromiseRef = useRef<Promise<void> | null>(null);
  const seededOtIdsRef = useRef<Set<string>>(new Set());
  /** REQ-195: no re-sembrar catalogPending desde origen si ya hay líneas BD. */
  const skipOtSeedFromOrigenRef = useRef(false);
  /** Tras Mateo/organizador: un Guardar avance (OV existente). */
  const pendingDraftSaveAfterReorgRef = useRef(false);
  const formScrollRef = useRef<HTMLDivElement | null>(null);
  const formScrollTopRef = useRef<number | null>(null);
  const revisionFocusRequestRef = useRef<RevisionPendiente | null>(null);

  return {
    selectedCompradorIdRef,
    skipDiscrepanciaConfirmRef,
    skipSaveConfirmRef,
    submitIntentRef,
    docsFileInputRef,
    bootstrapPromiseRef,
    seededOtIdsRef,
    skipOtSeedFromOrigenRef,
    pendingDraftSaveAfterReorgRef,
    formScrollRef,
    formScrollTopRef,
    revisionFocusRequestRef,
  };
}
