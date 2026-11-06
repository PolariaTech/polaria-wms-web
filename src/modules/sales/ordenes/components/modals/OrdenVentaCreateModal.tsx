import {useEffect, useMemo, useState} from "react";
import {usePolariaToast} from "@/components/shared/toast/PolariaToastProvider";
import {useFolioFacturaEdicion} from "../../surtido/guardar-folio-factura-captura.client";
import {type CompradorListRow} from "@/modules/admin-panel";
import type {CompradorAltaFicha} from "@/modules/admin-panel/compradores/utils/comprador-alta";
import {useCompany} from "@/providers/tenant/CompanyProvider";
import {useAuthStore} from "@/stores/auth.store";
import {type ProductoVentaOption} from "../../../shared/types/sales.types";
import { getOrdenVentaDetalle } from "../../../shared/services/sales.service";
import { resolveDenominacionComercial } from "../../utils/pedido/resolve-denominacion-comercial";
import {type OrigenAdjunto} from "../../utils/origen/origen-adjuntos";
import {isAfterWarehouseCutoff, todayIsoDate} from "../../utils/pedido/build-orden-venta-captura-observaciones";
import {groupOrigenCorreoToOrdenesTrabajo, type OrigenCorreoRenglon, type OrdenTrabajoHija} from "../../utils/origen/origen-correo-ordenes-trabajo";
import {isFechaEntregaAtrasada} from "../../utils/pedido/pedido-form-validation";
import {type CampoDiscrepancia} from "../../utils/pedido/map-pedido-extraido-to-form";
import type {BodegaDestinoOption, CaptureStep, LineaVentaForm, OrdenVentaCreateModalProps, PickerKind, ReagrupacionAplicada, StartMode} from "../../types/orden-venta-create-modal.types";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";
import {OrdenVentaModalShell} from "./OrdenVentaModalShell";
import {useContarProductosOt, useHandleSubmitOv} from "../../hooks/confirmar-envio-ov";
import {useEditarLineasOv} from "../../hooks/editar-lineas-ov";
import {useRefsOv} from "../../hooks/useRefsOv";
import {useAperturaDesdeDocsOv, useForzarFormularioAlEditar, useResetFormularioOv} from "../../hooks/reset-formulario-ov";
import {useCatalogoPickerOv, useEfectosCompaneroOv, useSembrarLineasDesdeOrigen} from "../../hooks/sembrar-lineas-desde-origen";
import {useAplicarCorreccionCorreoOv, useDeshacerReagrupacionOv} from "../../hooks/aplicar-correccion-correo-ov";
import {useAplicarReagrupacionOv, useCamposDeLaOtActiva, useEfectosFormularioOt} from "../../hooks/aplicar-reagrupacion-ov";
import {useBloqueoPaintEdicionOv} from "../../hooks/bloqueo-paint-edicion-ov";
import {useAbrirCapturaOv, useAvisosValidacionOv, usePrefillYDiscrepanciasOv} from "../../utils/pedido/campos-faltantes-ov";
import {useCierreCapturaOv, useFolioDesdeLista} from "../../utils/pedido/aviso-direccion-ov";
import {useSyncOtFormulario, useTotalesVentaOv} from "../../hooks/sync-ot-formulario";
import {useScrollFormularioOv, useSeleccionarCompradorModal} from "../../hooks/seleccionar-comprador-ov";

export function OrdenVentaCreateModal({
  open,
  onClose,
  onCreated,
  onEmitSuccess,
  onAutoPrintResult,
  idOrdenVenta = null,
  codigoVenta = null,
  cypherOpen = false,
  onToggleCypher,
  onOrdenIdReady,
  abrirReagruparAlCargar = false,
  onReagruparAlCargarAtendido,
  onCompanionOtPickerChange,
  operadorRowsForDuplicado = [],
  onCompanionIdCompradorChange,
}: OrdenVentaCreateModalProps) {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const { showToast } = usePolariaToast();
  const session = useAuthStore((state) => state.session);
  const idCreador = session?.idUsuario ?? "";
  const vendedorNombre = session?.nombre?.trim() ?? "";
  const editingId = idOrdenVenta?.trim() || "";
  const isEditing = Boolean(editingId);
  const folioFactura = useFolioFacturaEdicion({
    open,
    activo: isEditing,
    codigoCuenta,
    idOrdenVenta: editingId || null,
  });
  const [step, setStep] = useState<CaptureStep>("start");
  const [startMode, setStartMode] = useState<StartMode | null>(null);
  const [idComprador, setIdComprador] = useState("");
  const [compradorLabel, setCompradorLabel] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [ventanaDesde, setVentanaDesde] = useState("");
  const [ventanaHasta, setVentanaHasta] = useState("");
  const [prioridad, setPrioridad] = useState("Normal");
  const [moneda, setMoneda] = useState("MXN");
  const [ordenCompraHotel, setOrdenCompraHotel] = useState("");
  const [centroConsumo, setCentroConsumo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [direccion, setDireccion] = useState("");
  const [anden, setAnden] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [denominacionComercial, setDenominacionComercial] = useState("");
  const [turno, setTurno] = useState("");
  const [horaSalida, setHoraSalida] = useState("");
  const [chofer, setChofer] = useState("");
  const [unidad, setUnidad] = useState("");
  const [aceptaSustituciones, setAceptaSustituciones] = useState("");
  const [requiereLote, setRequiereLote] = useState("");
  const [registrarTemperatura, setRegistrarTemperatura] = useState("");
  const [origenTexto, setOrigenTexto] = useState("");
  const [origenArchivoFiles, setOrigenArchivoFiles] = useState<File[]>([]);
  const [origenCorreoDraft, setOrigenCorreoDraft] = useState<
    OrigenCorreoRenglon[]
  >([]);
  const [ordenesTrabajoPreview, setOrdenesTrabajoPreview] = useState<
    OrdenTrabajoHija[]
  >([]);
  const [formOtPage, setFormOtPage] = useState(0);
  const [lineas, setLineas] = useState<LineaVentaForm[]>([]);
  const [reagruparOpen, setReagruparOpen] = useState(false);
  /** Id de la OV cuyo detalle ya está cargado en el formulario (no el de la OV anterior). */
  const [ordenCargadaId, setOrdenCargadaId] = useState<string | null>(null);
  const [fechaCreacion, setFechaCreacion] = useState("");
  const [reagruparAplicada, setReagruparAplicada] =
    useState<ReagrupacionAplicada | null>(null);
  const [productosBase, setProductosBase] = useState<ProductoVentaOption[]>(
    [],
  );
  const [precioOverrideByProducto, setPrecioOverrideByProducto] = useState<
    Record<string, number>
  >({});
  const [equivalenciaByProducto, setEquivalenciaByProducto] = useState<
    Record<string, string>
  >({});
  const productos = useMemo(
    () =>
      productosBase.map((row) => {
        const override = precioOverrideByProducto[row.idProducto];
        const equivalencia = equivalenciaByProducto[row.idProducto]?.trim();
        if (override == null && !equivalencia) return row;
        return {
          ...row,
          ...(override != null ? { precioUnitario: override } : {}),
          ...(equivalencia ? { equivalencia } : { equivalencia: null }),
        };
      }),
    [equivalenciaByProducto, precioOverrideByProducto, productosBase],
  );
  const [compradores, setCompradores] = useState<CompradorListRow[]>([]);
  const [bodegasDestino, setBodegasDestino] = useState<BodegaDestinoOption[]>([]);
  const [idBodegaDestino, setIdBodegaDestino] = useState("");
  const [pendingEmitId, setPendingEmitId] = useState<string | null>(null);
  const [editingEstado, setEditingEstado] = useState<string | null>(null);
  /** Folio OV visible en header al editar (REQ-109). */
  const [editingCodigo, setEditingCodigo] = useState("");
  const folioVisible =
    editingCodigo.trim() || codigoVenta?.trim() || "";
  const [picker, setPicker] = useState<PickerKind>(null);
  /** Índice de línea a reemplazar en el picker de producto; null = agregar. */
  const [replaceLineaIndex, setReplaceLineaIndex] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formDataReady, setFormDataReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  /** Mensaje bajo Mateo (ej. Imprimiendo…) sin quitar la pantalla de carga. */
  const [mateoBusyMessage, setMateoBusyMessage] = useState<string | undefined>();
  const [isReadingIa, setIsReadingIa] = useState(false);
  const [isDocsDropActive, setIsDocsDropActive] = useState(false);
  /** Adjuntos ya persistidos (URL Cloudinary) al editar o tras subir. */
  const [origenAdjuntos, setOrigenAdjuntos] = useState<OrigenAdjunto[]>([]);
  /** PDFs/Excel reales dentro del .eml (misma lógica que el cypher). */
  const [emlInnerAdjuntos, setEmlInnerAdjuntos] = useState<OrigenAdjunto[]>([]);
  const [isCompradorCreateOpen, setIsCompradorCreateOpen] = useState(false);
  const [fichaComprador, setFichaComprador] = useState<CompradorAltaFicha | null>(
    null,
  );
  const [exigeOc, setExigeOc] = useState(false);
  /** Nombre de cliente que Mateo leyó cuando no hubo match exacto. */
  const [compradorNombreIa, setCompradorNombreIa] = useState<string | null>(
    null,
  );
  /** Sugerencias fuzzy de compradores (más cercanas al texto de Mateo). */
  const [compradorSugerencias, setCompradorSugerencias] = useState<
    CompradorListRow[]
  >([]);
  const [autoFields, setAutoFields] = useState<Set<string>>(() => new Set());
  const [warnFields, setWarnFields] = useState<Set<string>>(() => new Set());
  /** Tras cambiar cliente: recordar revisar dirección del correo/PDF. */
  const [avisoVerificarDireccion, setAvisoVerificarDireccion] = useState(false);
  const [missingFields, setMissingFields] = useState<Set<string>>(
    () => new Set(),
  );
  const [discrepancias, setDiscrepancias] = useState<CampoDiscrepancia[]>([]);
  const [confirmDiscrepanciasOpen, setConfirmDiscrepanciasOpen] =
    useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [confirmRemoveOtId, setConfirmRemoveOtId] = useState<string | null>(
    null,
  );
  const [addOtOpen, setAddOtOpen] = useState(false);
  const [addOtAlmacen, setAddOtAlmacen] = useState("");
  const [addOtNumeroPedido, setAddOtNumeroPedido] = useState("");
  // Las refs compartidas con los hooks viven en useRefsOv (ver su nota sobre react-hooks/refs).
  const refs = useRefsOv();
  const [cantidadFocusId, setCantidadFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDenominacionComercial("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !formDataReady || !isEditing || !editingId || !codigoCuenta) {
      return;
    }
    let cancelled = false;
    void getOrdenVentaDetalle({
      codigoCuenta,
      idOrdenVenta: editingId,
    })
      .then((detalle) => {
        if (cancelled) return;
        const compradorRow = compradores.find(
          (row) => row.idComprador === (detalle.id_comprador ?? "").trim(),
        );
        const overrideComprador =
          compradorRow?.denominacionComercialOverride?.trim() || "";
        setDenominacionComercial(
          resolveDenominacionComercial({
            override:
              detalle.denominacion_comercial_override?.trim() ||
              overrideComprador ||
              null,
            apodoSincronizado: detalle.comprador_apodo,
          }),
        );
      })
      .catch(() => {
        if (cancelled) return;
      });
    return () => {
      cancelled = true;
    };
  }, [open, formDataReady, isEditing, editingId, codigoCuenta, compradores]);

  const bolsa = {
    open, onClose, onCreated, onEmitSuccess, onAutoPrintResult, idOrdenVenta, codigoVenta,
    cypherOpen, onToggleCypher, onOrdenIdReady, activeBodegaId, abrirReagruparAlCargar, onReagruparAlCargarAtendido,
    onCompanionOtPickerChange, operadorRowsForDuplicado, onCompanionIdCompradorChange,
    codigoCuenta, showToast, session, idCreador, vendedorNombre, editingId, isEditing, folioFactura,
    step, setStep, startMode, setStartMode, idComprador, setIdComprador, compradorLabel, setCompradorLabel,
    fechaEntrega, setFechaEntrega, ventanaDesde, setVentanaDesde, ventanaHasta, setVentanaHasta,
    prioridad, setPrioridad, moneda, setMoneda, ordenCompraHotel, setOrdenCompraHotel,
    centroConsumo, setCentroConsumo, observaciones, setObservaciones, direccion, setDireccion,
    anden, setAnden, contacto, setContacto, telefono, setTelefono, correo, setCorreo,
    denominacionComercial, setDenominacionComercial,
    turno, setTurno, horaSalida, setHoraSalida, chofer, setChofer, unidad, setUnidad,
    aceptaSustituciones, setAceptaSustituciones, requiereLote, setRequiereLote,
    registrarTemperatura, setRegistrarTemperatura, origenTexto, setOrigenTexto,
    origenArchivoFiles, setOrigenArchivoFiles, origenCorreoDraft, setOrigenCorreoDraft,
    ordenesTrabajoPreview, setOrdenesTrabajoPreview, formOtPage, setFormOtPage, lineas, setLineas,
    reagruparOpen, setReagruparOpen, ordenCargadaId, setOrdenCargadaId, fechaCreacion, setFechaCreacion,
    reagruparAplicada, setReagruparAplicada, productosBase, setProductosBase,
    precioOverrideByProducto, setPrecioOverrideByProducto, equivalenciaByProducto, setEquivalenciaByProducto,
    productos, compradores, setCompradores, bodegasDestino, setBodegasDestino,
    idBodegaDestino, setIdBodegaDestino, pendingEmitId, setPendingEmitId,
    editingEstado, setEditingEstado, editingCodigo, setEditingCodigo, folioVisible,
    picker, setPicker, replaceLineaIndex, setReplaceLineaIndex, error, setError,
    successMessage, setSuccessMessage, isLoading, setIsLoading, formDataReady, setFormDataReady,
    isSaving, setIsSaving, mateoBusyMessage, setMateoBusyMessage, isReadingIa, setIsReadingIa,
    isDocsDropActive, setIsDocsDropActive, origenAdjuntos, setOrigenAdjuntos,
    emlInnerAdjuntos, setEmlInnerAdjuntos, isCompradorCreateOpen, setIsCompradorCreateOpen,
    fichaComprador, setFichaComprador, exigeOc, setExigeOc, compradorNombreIa, setCompradorNombreIa,
    compradorSugerencias, setCompradorSugerencias, autoFields, setAutoFields, warnFields, setWarnFields,
    avisoVerificarDireccion, setAvisoVerificarDireccion, missingFields, setMissingFields,
    discrepancias, setDiscrepancias, confirmDiscrepanciasOpen, setConfirmDiscrepanciasOpen,
    confirmSaveOpen, setConfirmSaveOpen, confirmDiscardOpen, setConfirmDiscardOpen,
    confirmRemoveOtId, setConfirmRemoveOtId, addOtOpen, setAddOtOpen,
    addOtAlmacen, setAddOtAlmacen, addOtNumeroPedido, setAddOtNumeroPedido,
    ...refs,
    cantidadFocusId, setCantidadFocusId,
  } as unknown as OrdenVentaFormEstado;
  Object.assign(bolsa, useScrollFormularioOv(bolsa));
  bolsa.hasProductos = productos.length > 0;
  bolsa.afterCutoff = isAfterWarehouseCutoff();
  bolsa.fechaEntregaAtrasada = isFechaEntregaAtrasada(fechaEntrega, todayIsoDate());
  bolsa.productosParaAgregar = productos;
  Object.assign(bolsa, useCatalogoPickerOv(bolsa));
  bolsa.ordenesTrabajoForm = useMemo(() => {
    if (ordenesTrabajoPreview.length > 0) return ordenesTrabajoPreview;
    return groupOrigenCorreoToOrdenesTrabajo(origenCorreoDraft);
  }, [ordenesTrabajoPreview, origenCorreoDraft]);
  Object.assign(bolsa, useAvisosValidacionOv(bolsa));
  Object.assign(bolsa, useContarProductosOt());
  useForzarFormularioAlEditar(bolsa);
  Object.assign(bolsa, useSyncOtFormulario(bolsa));
  Object.assign(bolsa, useAplicarReagrupacionOv(bolsa));
  Object.assign(bolsa, useAplicarCorreccionCorreoOv(bolsa));
  Object.assign(bolsa, useDeshacerReagrupacionOv(bolsa));
  useEfectosCompaneroOv(bolsa);
  useEfectosFormularioOt(bolsa);
  Object.assign(bolsa, useSembrarLineasDesdeOrigen(bolsa));
  Object.assign(bolsa, useTotalesVentaOv(bolsa));
  useFolioDesdeLista(bolsa);
  Object.assign(bolsa, usePrefillYDiscrepanciasOv(bolsa));
  Object.assign(bolsa, useSeleccionarCompradorModal(bolsa));
  // REQ-170: tapar paint antes del bootstrap (layout) para no mostrar OCC/productos a medias.
  useBloqueoPaintEdicionOv(bolsa);
  Object.assign(bolsa, useResetFormularioOv(bolsa));
  Object.assign(bolsa, useEditarLineasOv(bolsa));
  Object.assign(bolsa, useAbrirCapturaOv(bolsa));
  useCamposDeLaOtActiva(bolsa);
  Object.assign(bolsa, useAperturaDesdeDocsOv(bolsa));
  Object.assign(bolsa, useHandleSubmitOv(bolsa));
  Object.assign(bolsa, useCierreCapturaOv(bolsa));
  bolsa.showMateoLoading = open && (isReadingIa || isSaving);
  return (
    <OrdenVentaModalShell estado={bolsa} />
  );
}
