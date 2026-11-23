"use client";

import { formatKgEs } from "@/lib/utils/decimal-es";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import type { PreviewProductoRow } from "./custodio-orden-salida.helpers";

interface CustodioOrdenSalidaPreviewModalProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  rows: PreviewProductoRow[];
}

export function CustodioOrdenSalidaPreviewModal({
  open,
  onClose,
  loading,
  rows,
}: CustodioOrdenSalidaPreviewModalProps) {
  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title="Previsualización del envío"
      description="Productos que se enviarán con las ventas del paquete."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      {loading ? (
        <PolariaStatusLoading
          embedded
          title="Cargando productos…"
          message="Estamos preparando la previsualización."
          className="py-4"
        />
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          No hay productos para previsualizar.
        </p>
      ) : (
        <div className="max-h-[min(55dvh,26rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-polaria-bg">
              <tr className="border-b border-polaria-t-20 bg-polaria-bg">
                <th className="bg-polaria-bg px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                  Venta
                </th>
                <th className="bg-polaria-bg px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                  Comprador
                </th>
                <th className="bg-polaria-bg px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                  Producto
                </th>
                <th className="bg-polaria-bg px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-polaria-w-08 text-polaria-w last:border-b-0"
                >
                  <td className="px-3 py-2.5 align-middle polaria-text-body-sm font-medium text-polaria-teal">
                    {row.venta}
                  </td>
                  <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                    {row.comprador}
                  </td>
                  <td className="max-w-[14rem] truncate px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                    {row.producto}
                  </td>
                  <td className="px-3 py-2.5 align-middle polaria-text-body-sm whitespace-nowrap">
                    {formatKgEs(row.cantidadKg)} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PolariaFormModal>
  );
}
