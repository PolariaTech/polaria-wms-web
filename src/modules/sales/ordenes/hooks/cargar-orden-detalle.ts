import { normalizeEstadoOrdenVenta } from "../../shared/constants/sales-status";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { extractCorreoContactoDesdeTexto } from "../utils/origen/correo-chrome";
import {
  flattenOrdenesTrabajoToOrigenCorreo,
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import { parseOrigenArchivos } from "../utils/origen/origen-adjuntos";
import {
  cleanCorreoBodyForNotas,
  isCuerpoMensajeFormato,
} from "../utils/origen/texto-origen-pedido";
import { parseOrdenVentaCapturaObservaciones } from "../utils/pedido/build-orden-venta-captura-observaciones";
import { mapDetalleLineasAForm, ovTieneLineasMaterializadas } from "../utils/pedido/map-detalle-lineas-a-form";
import { resolveOccCampoFormulario } from "../utils/pedido/occ-alineada-listado-ov";
import { sanitizeOrigenCorreoNumeroPedido } from "../utils/pedido/normalize-numero-pedido";
import { resolverFechaCreacionEdicion } from "../utils/pedido/resolver-fecha-creacion-edicion";
import { sanitizeTelefonoContacto } from "../utils/pedido/sanitize-telefono-contacto";
import {
  aplicarSelloCabeceraAHijas,
  leerCabeceraUsuarioSello,
} from "../utils/pedido/sellar-edicion-usuario-origen";
import { withNotasGeneralesOnHijas } from "../utils/ot/notas-generales-ot";
import { formatCompradorOrdenVenta } from "../utils/display/orden-venta-display";
import {
  formatBodegaDestinoOption,
  formatCompradorLabel,
  resolveBodegaDestinoInicial,
  toDateInputValue,
} from "../utils/pedido/orden-venta-create-helpers";
import { aplicarDetalleExternoPorConfirmar, aplicarDetalleSinMateo, cargarFichaYPreciosDeComprador } from "./cargar-orden-al-abrir";
import { notasCanonConSelloUsuario } from "./aplicar-cabecera-con-sello-usuario";

export function aplicarDetalleCargado(entrada: OrdenVentaFormEstado) {
  const { productoRows, compradorRows, internas, externas, idBodegaDefault, detalle, codigoCuenta, editingId, codigoVenta, handleSelectComprador, selectedCompradorIdRef, skipOtSeedFromOrigenRef, setProductosBase, setCompradores, setBodegasDestino, setIdBodegaDestino, setEditingEstado, setFechaCreacion, setOrdenCargadaId, setEditingCodigo, setIdComprador, setCompradorLabel, setFechaEntrega, setVentanaDesde, setVentanaHasta, setPrioridad, setMoneda, setOrdenCompraHotel, setCentroConsumo, setObservaciones, setDireccion, setAnden, setContacto, setTelefono, setCorreo, setTurno, setHoraSalida, setChofer, setUnidad, setAceptaSustituciones, setRequiereLote, setRegistrarTemperatura, setOrigenTexto, setOrigenAdjuntos, setOrigenCorreoDraft, setOrdenesTrabajoPreview, setCompradorNombreIa, setCompradorSugerencias, setLineas, setStartMode, setFormOtPage, setStep, setMissingFields, setDiscrepancias, setAutoFields, setWarnFields, setFichaComprador, setExigeOc, setPrecioOverrideByProducto, setEquivalenciaByProducto } = entrada;
        setProductosBase(productoRows);
        setCompradores(compradorRows);
        const incluirTipo = internas.length > 0 && externas.length > 0;
        const destinoRows = [
          ...internas.map((bodega: { idBodega: string; nombre: string; codigo: string }) =>
            formatBodegaDestinoOption(bodega, "interna", incluirTipo),
          ),
          ...externas.map((bodega: { idBodega: string; nombre: string; codigo: string }) =>
            formatBodegaDestinoOption(bodega, "externa", incluirTipo),
          ),
        ];
        setBodegasDestino(destinoRows);
        setIdBodegaDestino(
          resolveBodegaDestinoInicial(destinoRows, idBodegaDefault),
        );

        if (!detalle) return;

        setEditingEstado(detalle.estado);
        setFechaCreacion(
          resolverFechaCreacionEdicion(
            detalle.created_at,
            detalle.fecha_pedido,
          ),
        );
        setOrdenCargadaId(editingId || null);
        setEditingCodigo(
          detalle.codigo?.trim() || codigoVenta?.trim() || "",
        );
        const idCompradorDetalle = detalle.id_comprador?.trim() || "";
        selectedCompradorIdRef.current = idCompradorDetalle;
        setIdComprador(idCompradorDetalle);
        const compradorRow = compradorRows.find(
          (row: { idComprador: string }) => row.idComprador === idCompradorDetalle,
        );
        {
          const labelSinId = formatCompradorOrdenVenta(detalle);
          setCompradorLabel(
            compradorRow
              ? formatCompradorLabel(compradorRow)
              : labelSinId === "—"
                ? ""
                : labelSinId,
          );
        }
        setFechaEntrega(toDateInputValue(detalle.fecha_entrega));
        setVentanaDesde(detalle.ventana_desde?.trim() || "");
        setVentanaHasta(detalle.ventana_hasta?.trim() || "");
        setPrioridad(detalle.prioridad?.trim() || "Normal");
        setMoneda(detalle.moneda?.trim() || "MXN");
        const origenTextoLoad = (() => {
          const raw = detalle.origen_texto?.trim() || "";
          if (!raw) return "";
          return isCuerpoMensajeFormato(raw) ? raw : cleanCorreoBodyForNotas(raw);
        })();
        // REQ-170: alinear OCC del formulario con la columna OCC del listado.
        setOrdenCompraHotel(
          resolveOccCampoFormulario({
            ordenCompraHotelGuardada: detalle.orden_compra_hotel,
            propuestaMateo: "",
            origenTexto: origenTextoLoad,
            origenCorreo: detalle.origen_correo,
          }),
        );
        const origenCorreoRows = sanitizeOrigenCorreoNumeroPedido(
          parseOrigenCorreoJson(detalle.origen_correo),
          origenTextoLoad,
        );
        const selloEarly = leerCabeceraUsuarioSello(origenCorreoRows);
        setCentroConsumo(
          selloEarly?.centroConsumo ??
            (detalle.centro_consumo?.trim() || ""),
        );
        const notasCanon = notasCanonConSelloUsuario({
          origenCorreoRows,
          notasAlmacen: detalle.notas_almacen ?? "",
          observacionesOv: parseOrdenVentaCapturaObservaciones(
            detalle.observaciones,
          ).observaciones,
          origenTexto: detalle.origen_texto,
        });
        setObservaciones(notasCanon);
        setDireccion(
          selloEarly?.direccionEntrega ??
            (detalle.direccion_entrega?.trim() || ""),
        );
        setAnden(detalle.anden?.trim() || "");
        setContacto(
          selloEarly?.contacto ?? (detalle.contacto_entrega?.trim() || ""),
        );
        setTelefono(
          sanitizeTelefonoContacto(
            selloEarly?.telefono ?? detalle.telefono_contacto,
          ),
        );
        setCorreo(
          selloEarly?.correo ??
            (detalle.correo_contacto?.trim() ||
              extractCorreoContactoDesdeTexto(detalle.origen_texto) ||
              extractCorreoContactoDesdeTexto(detalle.observaciones) ||
              ""),
        );
        setTurno(detalle.turno?.trim() || "");
        setHoraSalida(detalle.hora_salida?.trim() || "");
        setChofer(detalle.chofer?.trim() || "");
        setUnidad(detalle.unidad?.trim() || "");
        setAceptaSustituciones(detalle.acepta_sustituciones?.trim() || "");
        setRequiereLote(detalle.requiere_lote?.trim() || "");
        setRegistrarTemperatura(detalle.registrar_temperatura?.trim() || "");
        setOrigenTexto(origenTextoLoad);
        setOrigenAdjuntos(parseOrigenArchivos(detalle.origen_archivos));
        // REQ-141/281: notas y cabecera del sello; no reinyectar Mateo al form.
        const hijasBase = withNotasGeneralesOnHijas(
          groupOrigenCorreoToOrdenesTrabajo(origenCorreoRows),
          notasCanon,
        );
        const hijasEdit = selloEarly
          ? aplicarSelloCabeceraAHijas(hijasBase, selloEarly)
          : hijasBase;
        setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(hijasEdit));
        setOrdenesTrabajoPreview(hijasEdit);
        if (detalle.id_bodega_destino?.trim()) {
          setIdBodegaDestino(detalle.id_bodega_destino.trim());
        }

        // Texto del cliente en el origen (caption bajo el campo), aunque ya esté matcheado.
        const nombreEscritoOrigen =
          origenCorreoRows
            .map((row) => row["Nombre cliente"]?.trim())
            .find((value): value is string => Boolean(value)) || null;

        const esExternoPorConfirmar =
          normalizeEstadoOrdenVenta(detalle.estado) === "por_confirmar" &&
          origenCorreoRows.length > 0;
        const detalleLineas = detalle.lineas ?? [];
        const notasLineas = detalle.notas_lineas?.trim() || "";
        // REQ-195: si ya hay líneas en BD, no remapear todo desde origen.
        const ovMaterializada = ovTieneLineasMaterializadas(detalleLineas);
        const lineasDesdeDetalle = () =>
          mapDetalleLineasAForm({
            detalleLineas,
            productoRows,
            origenCorreoRows,
            idBodegaDetalle: detalle.id_bodega,
            notasLineas,
            hijas: hijasEdit,
          });

        // OV del tercero: Mateo interpreta origen_correo → formulario (1ª OT) + Cypher.
        if (esExternoPorConfirmar) {
          aplicarDetalleExternoPorConfirmar({
            origenCorreoRows,
            detalle,
            idCompradorDetalle,
            nombreEscritoOrigen,
            setCompradorNombreIa,
            compradorRows,
            handleSelectComprador,
            selectedCompradorIdRef,
            ovMaterializada,
            setCompradorSugerencias,
            setIdComprador,
            setCompradorLabel,
            setPrioridad,
            productoRows,
            hijasEdit,
            setFechaEntrega,
            setCentroConsumo,
            setObservaciones,
            setOrdenCompraHotel,
            setDireccion,
            setAnden,
            setContacto,
            setTelefono,
            setCorreo,
            setVentanaDesde,
            setVentanaHasta,
            setAceptaSustituciones,
            setRequiereLote,
            setRegistrarTemperatura,
            setAutoFields,
            setWarnFields,
            setMissingFields,
            setDiscrepancias,
            skipOtSeedFromOrigenRef,
            lineasDesdeDetalle,
            setLineas,
            setStartMode,
            setFormOtPage,
            setStep,
            setOrdenesTrabajoPreview,
            setOrigenCorreoDraft,
          } as OrdenVentaFormEstado);
        } else {
          aplicarDetalleSinMateo({
            ovMaterializada,
            lineasDesdeDetalle,
            hijasEdit,
            idCompradorDetalle,
            nombreEscritoOrigen,
            compradorRows,
            skipOtSeedFromOrigenRef,
            setLineas,
            setStartMode,
            setFormOtPage,
            setStep,
            setCompradorNombreIa,
            setCompradorLabel,
            setCompradorSugerencias,
            setMissingFields,
            origenCorreoRows,
            productoRows,
          });
        }

        cargarFichaYPreciosDeComprador({
          idCompradorDetalle,
          codigoCuenta,
          telefonoComprador: compradorRow?.telefono,
          selectedCompradorIdRef,
          setFichaComprador,
          setExigeOc,
          setPrecioOverrideByProducto,
          setEquivalenciaByProducto,
        });
}

