"use client";

import { CompradorCreateModal } from "@/modules/admin-panel";
import { OrdenVentaCompradorPickerModal } from "../pickers/OrdenVentaCompradorPickerModal";
import { OrdenVentaProductoPickerModal } from "../pickers/OrdenVentaProductoPickerModal";
import { OrdenVentaSugerenciasPickerModal } from "../pickers/OrdenVentaSugerenciasPickerModal";
import { OrdenVentaTablePickerModal } from "../pickers/OrdenVentaTablePickerModal";
import {
  MONEDA_OPTIONS,
  type OrdenVentaModalPickersProps,
} from "../../types/orden-venta-create-modal.types";
import { ovTieneIdParaCypher } from "../../utils/pedido/cypher-ov";
import { collectSugerenciasLinea } from "../../utils/pedido/orden-venta-create-helpers";

export function OrdenVentaModalPickers(props: OrdenVentaModalPickersProps) {
  const {
    picker, setPicker, compradores, compradoresParaPicker, compradorPickerPriorityIds, idComprador,
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
        compradores={
          compradoresParaPicker?.length ? compradoresParaPicker : compradores
        }
        priorityIds={compradorPickerPriorityIds}
        selectedId={idComprador}
        onSelect={(row) => {
          handleSelectComprador(row, {
            verificarDireccionEntrega: true,
            // REQ-326: conservar nombre Mateo para volver a rankear el picker.
            preservePedidoData: true,
          });
        }}
        title={
          !idComprador &&
          (Boolean(compradorNombreIa) ||
            compradorPickerPriorityIds.length > 0 ||
            compradorSugerencias.length > 0)
            ? "Elegir cliente"
            : idComprador
              ? "Cambiar cliente"
              : "Seleccionar cliente"
        }
        description={
          compradorPickerPriorityIds.length > 0
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
