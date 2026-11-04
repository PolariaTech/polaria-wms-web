"use client";

import { CompradorCreateModal, type CompradorListRow } from "@/modules/admin-panel";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { OrdenVentaCompradorPickerModal } from "../pickers/OrdenVentaCompradorPickerModal";
import { OrdenVentaProductoPickerModal } from "../pickers/OrdenVentaProductoPickerModal";
import { OrdenVentaSugerenciasPickerModal } from "../pickers/OrdenVentaSugerenciasPickerModal";
import { OrdenVentaTablePickerModal } from "../pickers/OrdenVentaTablePickerModal";
import type { OrdenVentaModalPickersProps } from "../../types/orden-venta-create-modal.types";
import { ovTieneIdParaCypher } from "../../utils/pedido/cypher-ov";
import { collectSugerenciasLinea } from "../../utils/pedido/orden-venta-create-helpers";
import { MONEDA_OPTIONS } from "../../types/orden-venta-create-modal.types";

import { Plus } from "lucide-react";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { cn } from "@/lib/utils/cn";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";

function countProductosOt(hija: OrdenTrabajoHija): number {
  return hija.renglones.filter(
    (row) =>
      (row.Producto ?? "").trim() || (row["Codigo producto"] ?? "").trim(),
  ).length;
}

function AddTareaButton({ onAddTarea }: { onAddTarea: () => void }) {
  return (
    <button
      type="button"
      onClick={onAddTarea}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-2.5",
        "polaria-text-body-sm font-semibold text-polaria-w transition hover:border-polaria-teal",
      )}
    >
      <Plus className="h-4 w-4 text-polaria-teal" aria-hidden />
      Agregar tarea de almacén
    </button>
  );
}

function PickOtCypher({
  total,
  onAddTarea,
}: {
  total: number;
  onAddTarea: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="polaria-text-body-sm text-polaria-w-50">
        Esta venta tiene{" "}
        <span className="font-semibold text-polaria-teal">
          {total} órdenes de trabajo
        </span>
        . Elige cuál quieres revisar en el panel Cypher a la derecha.
      </p>
      <AddTareaButton onAddTarea={onAddTarea} />
    </div>
  );
}

function PickOtGrid({
  hijas,
  onEdit,
  onRemove,
  onAddTarea,
}: {
  hijas: OrdenTrabajoHija[];
  onEdit: (index: number) => void;
  onRemove: (hijaId: string) => void;
  onAddTarea: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="polaria-text-body-sm text-polaria-w-50">
        Esta venta tiene{" "}
        <span className="font-semibold text-polaria-teal">
          {hijas.length} órdenes de trabajo
        </span>
        . Elige cuál quieres editar, o agrega/elimina si faltan o sobran.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {hijas.map((hija, index) => (
          <div
            key={hija.id}
            className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-4"
          >
            <button
              type="button"
              onClick={() => onEdit(index)}
              className={cn(
                "w-full text-left transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <p className="polaria-text-body-sm font-semibold text-polaria-w">
                {hija.label}
              </p>
              <p className="mt-1 polaria-text-caption text-polaria-w-50">
                {countProductosOt(hija)} producto
                {countProductosOt(hija) === 1 ? "" : "s"} ·{" "}
                {formatKgEs(hija.totalCantidad)} kg
              </p>
              {hija.almacen ? (
                <p className="mt-1 polaria-text-caption text-polaria-w-50">
                  {hija.almacen}
                </p>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => onRemove(hija.id)}
              className="mt-3 polaria-text-caption text-polaria-w-50 transition hover:text-polaria-teal"
            >
              Eliminar tarea
            </button>
          </div>
        ))}
      </div>
      <AddTareaButton onAddTarea={onAddTarea} />
    </div>
  );
}

export function OrdenVentaCapturePickOt({
  cypherOpen,
  hijas,
  onEdit,
  onRemove,
  onAddTarea,
}: {
  cypherOpen: boolean;
  hijas: OrdenTrabajoHija[];
  onEdit: (index: number) => void;
  onRemove: (hijaId: string) => void;
  onAddTarea: () => void;
}) {
  if (cypherOpen) {
    return <PickOtCypher total={hijas.length} onAddTarea={onAddTarea} />;
  }
  return (
    <PickOtGrid
      hijas={hijas}
      onEdit={onEdit}
      onRemove={onRemove}
      onAddTarea={onAddTarea}
    />
  );
}


export function OrdenVentaModalPickers(props: OrdenVentaModalPickersProps) {
  const {
    picker, setPicker, compradores, compradorPickerPriorityIds, idComprador,
    handleSelectComprador, compradorNombreIa, compradorSugerencias, cypherOpen,
    isEditing, pendingEmitId, productosParaPicker, productoPickerPriorityIds, replaceLineaIndex,
    setReplaceLineaIndex, lineas, handleSelectProducto, handleAcceptSugerencia,
    handleOpenReplaceProducto, moneda, setMoneda, bodegasDestino, idBodegaDestino,
    setIdBodegaDestino, isCompradorCreateOpen, setIsCompradorCreateOpen, startMode,
    step, setStartMode, handleCompradorCreatedForSale,
  } = props;
  // REQ-199: con id de OV (aunque no se abriera para editar) los selectores se acoplan junto a Cypher.
  const dockConCypher = cypherOpen && ovTieneIdParaCypher({ isEditing, pendingEmitId });
  return (
    <>
      <OrdenVentaCompradorPickerModal
        open={picker === "comprador"}
        onClose={() => setPicker(null)}
        compradores={compradores}
        priorityIds={compradorPickerPriorityIds}
        selectedId={idComprador}
        onSelect={(row) => {
          handleSelectComprador(row, {
            verificarDireccionEntrega: true,
            keepNombreIa: Boolean(compradorNombreIa),
            preservePedidoData: true,
          });
        }}
        title={
          !idComprador &&
          (Boolean(compradorNombreIa) || compradorSugerencias.length > 0)
            ? "Elegir cliente"
            : idComprador
              ? "Cambiar cliente"
              : "Seleccionar cliente"
        }
        description={
          !idComprador && compradorPickerPriorityIds.length > 0
            ? compradorNombreIa?.trim()
              ? `Catálogo completo. Arriba van primero las opciones más parecidas a «${compradorNombreIa.trim()}».`
              : "Catálogo completo. Arriba van primero las opciones más parecidas a lo del pedido."
            : "Catálogo completo de clientes de la cuenta."
        }
        dockWithCypher={dockConCypher}
      />

      <OrdenVentaProductoPickerModal
        open={picker === "producto"}
        onClose={() => {
          setPicker(null);
          setReplaceLineaIndex(null);
        }}
        productos={productosParaPicker}
        priorityIds={productoPickerPriorityIds}
        selectedId={
          replaceLineaIndex != null
            ? lineas[replaceLineaIndex]?.idProducto || null
            : null
        }
        onSelect={handleSelectProducto}
        title={
          replaceLineaIndex != null &&
          lineas[replaceLineaIndex]?.catalogPending
            ? "Elegir producto"
            : replaceLineaIndex != null
              ? "Reemplazar producto"
              : "Seleccionar producto"
        }
        description={
          replaceLineaIndex != null &&
          lineas[replaceLineaIndex]?.catalogPending
            ? lineas[replaceLineaIndex]?.aliasCliente?.trim()
              ? `Catálogo completo. Arriba van primero las opciones más parecidas a «${lineas[replaceLineaIndex]!.aliasCliente!.trim()}».`
              : "Catálogo completo. Arriba van primero las opciones más parecidas a lo del pedido."
            : replaceLineaIndex != null
              ? "Elige el producto del catálogo para esta línea del pedido."
              : "Catálogo completo de productos de la cuenta."
        }
        dockWithCypher={dockConCypher}
      />

      <OrdenVentaSugerenciasPickerModal
        open={picker === "sugerencias"}
        onClose={() => {
          setPicker(null);
          setReplaceLineaIndex(null);
        }}
        textoCliente={
          replaceLineaIndex != null
            ? lineas[replaceLineaIndex]?.aliasCliente ||
              lineas[replaceLineaIndex]?.nombre
            : null
        }
        sugerencias={
          replaceLineaIndex != null && lineas[replaceLineaIndex]
            ? collectSugerenciasLinea(lineas[replaceLineaIndex]!)
            : []
        }
        onSelect={(sug) => {
          if (replaceLineaIndex == null) return;
          handleAcceptSugerencia(replaceLineaIndex, sug);
        }}
        onOpenCatalogo={() => {
          const idx = replaceLineaIndex;
          if (idx == null) return;
          handleOpenReplaceProducto(idx);
        }}
        dockWithCypher={dockConCypher}
      />

      <OrdenVentaTablePickerModal
        open={picker === "moneda"}
        onClose={() => setPicker(null)}
        title="Seleccionar moneda"
        description="Monedas disponibles para el pedido."
        columns={["Moneda"]}
        rows={MONEDA_OPTIONS.map((option) => ({
          id: option.value,
          cells: [option.label],
        }))}
        selectedId={moneda}
        searchPlaceholder="Buscar moneda"
        emptyLabel="No hay monedas disponibles."
        onSelect={(row) => setMoneda(row.id)}
        dockWithCypher={dockConCypher}
      />

      <OrdenVentaTablePickerModal
        open={picker === "bodega"}
        onClose={() => setPicker(null)}
        title="Seleccionar bodega de origen"
        description="Bodegas disponibles de la cuenta."
        columns={["Bodega"]}
        rows={bodegasDestino.map((bodega) => ({
          id: bodega.idBodega,
          cells: [bodega.label],
        }))}
        selectedId={idBodegaDestino || null}
        searchPlaceholder="Buscar bodega"
        emptyLabel="No hay bodegas registradas."
        onSelect={(row) => setIdBodegaDestino(row.id)}
        dockWithCypher={dockConCypher}
      />

      <CompradorCreateModal
        open={isCompradorCreateOpen}
        stackLevel="nested"
        dockWithCypher={dockConCypher}
        onClose={() => {
          setIsCompradorCreateOpen(false);
          if (startMode === "first_time" && step === "start") {
            setStartMode(null);
          }
        }}
        onCreated={handleCompradorCreatedForSale}
      />

    </>
  );
}
