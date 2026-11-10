import { getCompradorAdmin, listCompradorProductoAliasAdmin } from "@/modules/admin-panel";
import type { CompradorListRow } from "@/modules/admin-panel";
import { fetchUltimosPreciosPorComprador } from "../../shared/services/sales.service";
import { buildPedidoExtraidoFromOrigenCorreo } from "../utils/origen/pedido-from-origen-correo";
import {
  todayIsoDate,
  tomorrowIsoDate,
} from "../utils/pedido/build-orden-venta-captura-observaciones";
import { mapPedidoExtraidoToForm } from "../utils/pedido/map-pedido-extraido-to-form";
import { buildOrdenVentaPrefillFromComprador } from "../utils/pedido/prefill-orden-venta-from-comprador";
import { resolvePropuestaClienteMateoAlReabrir } from "../utils/pedido/resolve-cabecera-guardada";
import { leerCabeceraUsuarioSello } from "../utils/pedido/sellar-edicion-usuario-origen";
import { applyVerificacionesOrigenALineas } from "../utils/pedido/apply-verificaciones-origen-lineas";
import { mergeLineasBdConOrigenPendiente } from "../utils/pedido/merge-lineas-bd-y-origen";
import { lineaFormDesdeIa } from "../utils/pedido/orden-venta-create-helpers";
import { flattenOrdenesTrabajoToOrigenCorreo } from "../utils/origen/origen-correo-ordenes-trabajo";
import { resolverCabeceraFormConSelloUsuario } from "./aplicar-cabecera-con-sello-usuario";
import {
  rankCompradoresFromNombre,
  shouldAutoAssignComprador,
} from "../utils/match/match-comprador-from-nombre";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { preciosYEquivalenciasDeComprador } from "./useClienteOv";

export { aplicarDetalleSinMateo } from "./aplicar-detalle-sin-mateo";

export function cargarFichaYPreciosDeComprador(input: {
  idCompradorDetalle: string;
  codigoCuenta: string;
  telefonoComprador?: string | null;
  selectedCompradorIdRef: { current: string };
  setFichaComprador: OrdenVentaFormEstado["setFichaComprador"];
  setExigeOc: OrdenVentaFormEstado["setExigeOc"];
  setPrecioOverrideByProducto: OrdenVentaFormEstado["setPrecioOverrideByProducto"];
  setEquivalenciaByProducto: OrdenVentaFormEstado["setEquivalenciaByProducto"];
}) {
  const {
    idCompradorDetalle, codigoCuenta, telefonoComprador, selectedCompradorIdRef,
    setFichaComprador, setExigeOc, setPrecioOverrideByProducto, setEquivalenciaByProducto,
  } = input;
  if (!idCompradorDetalle) return;
  void getCompradorAdmin({ codigoCuenta, idComprador: idCompradorDetalle })
    .then((adminDetalle) => {
      if (selectedCompradorIdRef.current !== idCompradorDetalle) return;
      setFichaComprador(adminDetalle.ficha);
      const prefill = buildOrdenVentaPrefillFromComprador({
        ficha: adminDetalle.ficha,
        telefonoComprador,
      });
      setExigeOc(prefill.exigeOc);
    })
    .catch(() => {
      if (selectedCompradorIdRef.current !== idCompradorDetalle) return;
      setFichaComprador(null);
      setExigeOc(false);
    });
  void Promise.all([
    listCompradorProductoAliasAdmin({ codigoCuenta, idComprador: idCompradorDetalle }),
    fetchUltimosPreciosPorComprador({ codigoCuenta, idComprador: idCompradorDetalle }).catch(
      () => ({}) as Record<string, number>,
    ),
  ])
    .then(([aliases, ultimos]) => {
      if (selectedCompradorIdRef.current !== idCompradorDetalle) return;
      const { overrides, equivalencias } = preciosYEquivalenciasDeComprador(aliases, ultimos);
      setPrecioOverrideByProducto(overrides);
      setEquivalenciaByProducto(equivalencias);
    })
    .catch(() => {
      if (selectedCompradorIdRef.current !== idCompradorDetalle) return;
      setPrecioOverrideByProducto({});
      setEquivalenciaByProducto({});
    });
}


export function aplicarDetalleExternoPorConfirmar(input: OrdenVentaFormEstado) {
  const { origenCorreoRows, detalle, idCompradorDetalle, nombreEscritoOrigen, setCompradorNombreIa, compradorRows, handleSelectComprador, selectedCompradorIdRef, ovMaterializada, setCompradorSugerencias, setIdComprador, setCompradorLabel, setPrioridad, productoRows, hijasEdit, setFechaEntrega, setCentroConsumo, setObservaciones, setOrdenCompraHotel, setDireccion, setAnden, setContacto, setTelefono, setCorreo, setVentanaDesde, setVentanaHasta, setAceptaSustituciones, setRequiereLote, setRegistrarTemperatura, setAutoFields, setWarnFields, setMissingFields, setDiscrepancias, skipOtSeedFromOrigenRef, lineasDesdeDetalle, setLineas, setStartMode, setFormOtPage, setStep, setOrdenesTrabajoPreview, setOrigenCorreoDraft } = input;
  if (!detalle) return;
          const selloUsuario = leerCabeceraUsuarioSello(origenCorreoRows);
          const pedido = buildPedidoExtraidoFromOrigenCorreo({
            origenCorreo: origenCorreoRows,
            origenTexto: detalle.origen_texto,
            notasAlmacen: detalle.notas_almacen,
          });

          // REQ-166: propuesta de Mateo (pedido/origen), no el Cliente del Cypher-correo.
          const propuestaMateo = resolvePropuestaClienteMateoAlReabrir({
            idComprador: idCompradorDetalle,
            nombrePedidoMateo: pedido.nombreCliente,
            nombreEnOrigen: nombreEscritoOrigen,
          });
          if (propuestaMateo) {
            setCompradorNombreIa(propuestaMateo);
          }

          const compradorRank = rankCompradoresFromNombre(
            propuestaMateo || pedido.nombreCliente,
            compradorRows,
          );
          const autoComprador = shouldAutoAssignComprador(
            compradorRank,
            propuestaMateo || pedido.nombreCliente,
          );
          // Si ya venía un comprador de materialización pero no es match exacto
          // del texto del cliente, no lo dejamos elegido: solo sugerencias.
          const detalleEsExacto =
            Boolean(autoComprador) &&
            autoComprador?.idComprador === idCompradorDetalle;
          let idCompradorForMap = detalleEsExacto ? idCompradorDetalle : "";
          let telefonoForMap = "";

          if (autoComprador) {
            handleSelectComprador(autoComprador, {
              keepNombreIa: Boolean(propuestaMateo || nombreEscritoOrigen),
              // No pisar Ship To del origen con la ficha del comprador.
              preservePedidoData: true,
            });
            idCompradorForMap = autoComprador.idComprador;
            telefonoForMap = autoComprador.telefono?.trim() || "";
          } else if (propuestaMateo) {
            // REQ-166: no dejar el campo vacío («Falta cliente») si Mateo ya propuso.
            // REQ-195: si la OV ya tiene comprador en BD, no lo borramos al reabrir.
            if (ovMaterializada && idCompradorDetalle) {
              setCompradorSugerencias(
                compradorRank.candidates.map((c) => c.comprador).slice(0, 4),
              );
    
            } else {
              selectedCompradorIdRef.current = "";
              setIdComprador("");
              setCompradorLabel(propuestaMateo);
              setCompradorSugerencias(
                compradorRank.candidates.map((c) => c.comprador).slice(0, 4),
              );
            }
          }

          const prioridadOrigen = origenCorreoRows
            .map((r: { Prioridad?: string }) => r.Prioridad?.trim())
            .find(Boolean);
          if (prioridadOrigen) setPrioridad(prioridadOrigen);

          const mapped = mapPedidoExtraidoToForm({
            pedido,
            productos: productoRows,
            ficha: {
              centroConsumo: selloUsuario?.centroConsumo ??
                (detalle.centro_consumo?.trim() || ""),
              ventanaDesde: detalle.ventana_desde?.trim() || "",
              ventanaHasta: detalle.ventana_hasta?.trim() || "",
              direccion: selloUsuario?.direccionEntrega ??
                (detalle.direccion_entrega?.trim() || ""),
              anden: detalle.anden?.trim() || "",
              contacto: selloUsuario?.contacto ??
                (detalle.contacto_entrega?.trim() || ""),
              telefono: selloUsuario
                ? selloUsuario.telefono
                : detalle.telefono_contacto?.trim() || telefonoForMap || "",
              correo: selloUsuario
                ? selloUsuario.correo
                : detalle.correo_contacto?.trim() || "",
              aceptaSustituciones: detalle.acepta_sustituciones?.trim() || "",
              requiereLote: detalle.requiere_lote?.trim() || "",
              registrarTemperatura:
                detalle.registrar_temperatura?.trim() || "",
              observaciones: selloUsuario?.notasGenerales ?? "",
            },
            tomorrowIso: tomorrowIsoDate(),
            todayIso: todayIsoDate(),
          });

          const cabeceraForm = resolverCabeceraFormConSelloUsuario({
            origenCorreoRows,
            detalle,
            mapped,
            hijasEdit,
            telefonoForMap,
          });
          setFechaEntrega(cabeceraForm.fechaEntrega);
          setCentroConsumo(cabeceraForm.centroConsumo);
          setObservaciones(cabeceraForm.observaciones);
          setOrdenCompraHotel(cabeceraForm.ordenCompraHotel);
          setDireccion(cabeceraForm.direccion);
          setAnden(cabeceraForm.anden);
          setContacto(cabeceraForm.contacto);
          setTelefono(cabeceraForm.telefono);
          setCorreo(cabeceraForm.correo);
          if (cabeceraForm.selloUsuario) {
            setOrdenesTrabajoPreview?.(cabeceraForm.hijasParaForm);
            setOrigenCorreoDraft?.(
              flattenOrdenesTrabajoToOrigenCorreo(cabeceraForm.hijasParaForm),
            );
          }
          setVentanaDesde(mapped.ventanaDesde);
          setVentanaHasta(mapped.ventanaHasta);
          setAceptaSustituciones(mapped.aceptaSustituciones);
          setRequiereLote(mapped.requiereLote);
          setRegistrarTemperatura(mapped.registrarTemperatura);
          setAutoFields(mapped.autoFields);
          setWarnFields(mapped.warnFields);
          const nextMissing = new Set(mapped.missingFields);
          if (
            (ovMaterializada && idCompradorDetalle) ||
            autoComprador ||
            idCompradorForMap
          ) {
            nextMissing.delete("cliente");
          } else {
            nextMissing.add("cliente");
          }
          if (!cabeceraForm.direccion.trim()) nextMissing.add("direccion");
          else nextMissing.delete("direccion");
          setMissingFields(nextMissing);
          setDiscrepancias(mapped.discrepancias);
          const hijasLineas = cabeceraForm.hijasParaForm;
          if (ovMaterializada) {
            // REQ-236: BD + renglones origen pendientes + _idProducto del avance.
            skipOtSeedFromOrigenRef.current = true;
            setLineas(
              mergeLineasBdConOrigenPendiente({
                lineasBd: lineasDesdeDetalle(),
                hijas: hijasLineas,
                origenRows: origenCorreoRows,
                productos: productoRows,
              }),
            );
          } else {
            skipOtSeedFromOrigenRef.current = false;
            // REQ-201: restaurar productos ya verificados al grabar avance.
            setLineas(
              applyVerificacionesOrigenALineas(
                mapped.lineas.map(lineaFormDesdeIa),
                origenCorreoRows,
                productoRows,
              ),
            );
          }
          setStartMode("docs");
          setFormOtPage(0);
          setStep("form");
}
