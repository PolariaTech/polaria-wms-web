"use client";

import {
  PolariaFormField,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { SolicitudCompraCreateLineasPanel } from "./SolicitudCompraCreateLineasPanel";
import { SolicitudProductoPickerModal } from "./SolicitudProductoPickerModal";
import { SolicitudProveedorPickerModal } from "./SolicitudProveedorPickerModal";
import { useSolicitudCompraCreate } from "./useSolicitudCompraCreate";

interface SolicitudCompraCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function SolicitudCompraCreateModalContent({
  open,
  onClose,
  onCreated,
}: SolicitudCompraCreateModalProps) {
  const {
    lines,
    pickProductId,
    setPickProductId,
    pickPesoKg,
    setPickPesoKg,
    idProveedor,
    setIdProveedor,
    productos,
    proveedores,
    proveedorPickerOpen,
    setProveedorPickerOpen,
    productoPickerOpen,
    setProductoPickerOpen,
    error,
    setError,
    isSubmitting,
    isLoadingOptions,
    selectedProveedorLabel,
    selectedProductoLabel,
    handleClose,
    addLine,
    removeLine,
    handleSubmit,
  } = useSolicitudCompraCreate({ open, onClose, onCreated });

  const disabled = isSubmitting || isLoadingOptions;
  const anyPickerOpen = proveedorPickerOpen || productoPickerOpen;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        sectionLabel="Nueva solicitud"
        title="Nueva solicitud"
        description="Solicitud · peso/kg"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel="Guardar solicitud"
        compact
        size="md"
        closeOnEscape={!anyPickerOpen}
      >
        <p className="polaria-text-body-sm text-polaria-w-50">
          Peso kg por ítem.
        </p>

        <PolariaFormField id="sol-proveedor" label="Proveedor" compact>
          <JefeBodegaModalSearchField
            id="sol-proveedor"
            value={selectedProveedorLabel}
            placeholder={
              isLoadingOptions
                ? "Cargando proveedores…"
                : proveedores.length === 0
                  ? "Sin proveedores"
                  : "Elegí proveedor…"
            }
            ariaLabel="Proveedor"
            onSearchClick={
              disabled || proveedores.length === 0
                ? undefined
                : () => setProveedorPickerOpen(true)
            }
          />
        </PolariaFormField>

        {proveedores.length === 0 && !isLoadingOptions ? (
          <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
            Tu administrador de cuenta debe registrar proveedores antes de crear
            solicitudes de compra.
          </p>
        ) : null}

        {productos.length === 0 && !isLoadingOptions ? (
          <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
            Tu administrador de cuenta debe registrar productos en el catálogo
            para poder armar solicitudes.
          </p>
        ) : null}

        <SolicitudCompraCreateLineasPanel
          lines={lines}
          productos={productos}
          selectedProductoLabel={selectedProductoLabel}
          pickPesoKg={pickPesoKg}
          disabled={disabled}
          isLoadingOptions={isLoadingOptions}
          onOpenProductoPicker={() => setProductoPickerOpen(true)}
          onChangePeso={setPickPesoKg}
          onAddLine={addLine}
          onRemoveLine={removeLine}
        />
      </PolariaFormModal>

      <SolicitudProveedorPickerModal
        open={proveedorPickerOpen}
        onClose={() => setProveedorPickerOpen(false)}
        proveedores={proveedores}
        selectedId={idProveedor || null}
        onSelect={(proveedor) => {
          setIdProveedor(proveedor.idProveedor);
          setError(null);
        }}
      />

      <SolicitudProductoPickerModal
        open={productoPickerOpen}
        onClose={() => setProductoPickerOpen(false)}
        productos={productos}
        selectedId={pickProductId || null}
        onSelect={(producto) => {
          setPickProductId(producto.idProducto);
          setError(null);
        }}
      />
    </>
  );
}
