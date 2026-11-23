"use client";

import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { OrdenVentaFotosGallery } from "./OrdenVentaFotosGallery";
import { OrdenVentaFotosOtPicker } from "./OrdenVentaFotosOtPicker";
import type {
  OrdenVentaFotoCapturaItem,
  OrdenVentaOtConFotosItem,
} from "./orden-venta-fotos-captura.types";
import { resolveOtFotoDisplay } from "./resolve-ot-foto-display";
import { useOrdenVentaFotosViewer } from "./use-orden-venta-fotos-viewer";

export type {
  OrdenVentaFotoCapturaItem,
  OrdenVentaOtConFotosItem,
} from "./orden-venta-fotos-captura.types";

interface OrdenVentaFotosCapturaModalProps {
  open: boolean;
  title: string;
  ordenesTrabajo: OrdenVentaOtConFotosItem[];
  fotos: OrdenVentaFotoCapturaItem[];
  selectedOt: string | null;
  isLoadingOts?: boolean;
  isLoadingFotos?: boolean;
  allowBackToOts?: boolean;
  dockWithCypher?: boolean;
  error?: string | null;
  onSelectOt: (idOrdenTrabajo: string) => void;
  onBackToOts: () => void;
  onClose: () => void;
}

export function OrdenVentaFotosCapturaModal({
  open,
  title,
  ordenesTrabajo,
  fotos,
  selectedOt,
  isLoadingOts = false,
  isLoadingFotos = false,
  allowBackToOts = true,
  dockWithCypher = false,
  error = null,
  onSelectOt,
  onBackToOts,
  onClose,
}: OrdenVentaFotosCapturaModalProps) {
  const showingFotos = selectedOt !== null;
  const selectedDisplay = selectedOt
    ? resolveOtFotoDisplay({ idOrdenTrabajo: selectedOt })
    : null;

  const viewer = useOrdenVentaFotosViewer(open, showingFotos, selectedOt, fotos.length);

  const description = showingFotos
    ? selectedDisplay?.centroConsumo
      ? `Historial · Pedido ${selectedDisplay.numeroPedido || "—"} · Centro ${selectedDisplay.centroConsumo}`
      : `Historial · ${selectedDisplay?.label ?? "TAREA"}`
    : "Elige la orden de trabajo para ver su historial de fotos.";

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      asForm={false}
      hideFooter
      stackLevel={dockWithCypher ? "base" : "nested"}
      compact={dockWithCypher}
      size="2xl"
      layout={dockWithCypher ? "dock-left" : "center"}
      closeOnBackdrop={!dockWithCypher}
      scrollClassName={
        dockWithCypher
          ? "min-h-0 flex-1 overflow-y-auto"
          : "max-h-[min(80vh,52rem)] overflow-y-auto"
      }
      onSubmit={(event) => event.preventDefault()}
      error={error}
    >
      {showingFotos ? (
        <OrdenVentaFotosGallery
          fotos={fotos}
          isLoadingFotos={isLoadingFotos}
          allowBackToOts={allowBackToOts}
          onBackToOts={onBackToOts}
          viewer={viewer}
        />
      ) : (
        <OrdenVentaFotosOtPicker
          ordenesTrabajo={ordenesTrabajo}
          isLoadingOts={isLoadingOts}
          onSelectOt={onSelectOt}
        />
      )}
    </PolariaFormModal>
  );
}