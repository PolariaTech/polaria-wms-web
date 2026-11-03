import { getCompradorAdmin, listCompradorProductoAliasAdmin } from "@/modules/admin-panel";
import type { CompradorListRow } from "@/modules/admin-panel";
import { fetchUltimosPreciosPorComprador } from "../../shared/services/sales.service";
import { extractCorreoContactoDesdeTexto } from "../utils/origen/correo-chrome";
import { resolveFechaEntregaDesdeOrigen } from "../utils/origen/materialize-ov-desde-origen";
import { buildPedidoExtraidoFromOrigenCorreo } from "../utils/origen/pedido-from-origen-correo";
import { sanitizeNotasGeneralesPedido } from "../utils/origen/texto-origen-pedido";
import {
  stripSurtidoFotoQrFromNotas,
  todayIsoDate,
  tomorrowIsoDate,
} from "../utils/pedido/build-orden-venta-captura-observaciones";
import { mapPedidoExtraidoToForm } from "../utils/pedido/map-pedido-extraido-to-form";
import { isFechaEntregaIsoValida } from "../utils/pedido/pedido-form-validation";
import { buildOrdenVentaPrefillFromComprador } from "../utils/pedido/prefill-orden-venta-from-comprador";
import {
  resolveCabeceraGuardada,
  resolvePropuestaClienteMateoAlReabrir,
} from "../utils/pedido/resolve-cabecera-guardada";
import { lineaFormDesdeIa, toDateInputValue } from "../utils/pedido/orden-venta-create-helpers";
import {
  rankCompradoresFromNombre,
  shouldAutoAssignComprador,
} from "../utils/match/match-comprador-from-nombre";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import { preciosYEquivalenciasDeComprador } from "./useClienteOv";

export function aplicarDetalleSinMateo(input: {
  ovMaterializada: boolean;
  lineasDesdeDetalle: () => LineaVentaForm[];
  hijasEdit: OrdenTrabajoHija[];
  idCompradorDetalle: string;
  nombreEscritoOrigen: string | null;
  compradorRows: CompradorListRow[];
  skipOtSeedFromOrigenRef: { current: boolean };
  setLineas: (value: LineaVentaForm[]) => void;
  setStartMode: (value: "docs") => void;
  setFormOtPage: (value: number) => void;
  setStep: (value: "form") => void;
  setCompradorNombreIa: (value: string | null) => void;
  setCompradorLabel: (value: string) => void;
  setCompradorSugerencias: (value: CompradorListRow[]) => void;
  setMissingFields: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
}) {
  const {
    ovMaterializada, lineasDesdeDetalle, hijasEdit, idCompradorDetalle,
    nombreEscritoOrigen, compradorRows, skipOtSeedFromOrigenRef, setLineas,
    setStartMode, setFormOtPage, setStep, setCompradorNombreIa, setCompradorLabel,
    setCompradorSugerencias, setMissingFields,
  } = input;
  skipOtSeedFromOrigenRef.current = ovMaterializada;
  setLineas(lineasDesdeDetalle());
  if (hijasEdit.length > 0) {
    setStartMode("docs");
    setFormOtPage(0);
    setStep("form");
  }
  const propuestaMateo = resolvePropuestaClienteMateoAlReabrir({
    idComprador: idCompradorDetalle,
    nombreEnOrigen: nombreEscritoOrigen,
  });
  if (!propuestaMateo) return;
  setCompradorNombreIa(propuestaMateo);
  setCompradorLabel(propuestaMateo);
  const compradorRank = rankCompradoresFromNombre(propuestaMateo, compradorRows);
  setCompradorSugerencias(compradorRank.candidates.map((c) => c.comprador).slice(0, 4));
  setMissingFields((prev) => {
    const next = new Set(prev);
    next.add("cliente");
    return next;
  });
}

export function cargarFichaYPreciosDeComprador(input: {
  idCompradorDetalle: string;
  codigoCuenta: string;
  telefonoComprador?: string | null;
  selectedCompradorIdRef: { current: string };
  setFichaComprador: (value: unknown) => void;
  setExigeOc: (value: boolean) => void;
  setPrecioOverrideByProducto: (value: Record<string, number>) => void;
  setEquivalenciaByProducto: (value: Record<string, string>) => void;
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


export function aplicarDetalleExternoPorConfirmar(input: Record<string, any>) {
  const { origenCorreoRows, detalle, idCompradorDetalle, nombreEscritoOrigen, setCompradorNombreIa, compradorRows, handleSelectComprador, selectedCompradorIdRef, ovMaterializada, setCompradorSugerencias, setIdComprador, setCompradorLabel, setPrioridad, productoRows, hijasEdit, setFechaEntrega, setCentroConsumo, setObservaciones, setOrdenCompraHotel, setDireccion, setAnden, setContacto, setTelefono, setCorreo, setVentanaDesde, setVentanaHasta, setAceptaSustituciones, setRequiereLote, setRegistrarTemperatura, setAutoFields, setWarnFields, setMissingFields, setDiscrepancias, skipOtSeedFromOrigenRef, lineasDesdeDetalle, setLineas, setStartMode, setFormOtPage, setStep } = input;
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
              centroConsumo: detalle.centro_consumo?.trim() || "",
              ventanaDesde: detalle.ventana_desde?.trim() || "",
              ventanaHasta: detalle.ventana_hasta?.trim() || "",
              direccion: detalle.direccion_entrega?.trim() || "",
              anden: detalle.anden?.trim() || "",
              contacto: detalle.contacto_entrega?.trim() || "",
              telefono:
                detalle.telefono_contacto?.trim() || telefonoForMap || "",
              correo: detalle.correo_contacto?.trim() || "",
              aceptaSustituciones: detalle.acepta_sustituciones?.trim() || "",
              requiereLote: detalle.requiere_lote?.trim() || "",
              registrarTemperatura:
                detalle.registrar_temperatura?.trim() || "",
              observaciones:
                sanitizeNotasGeneralesPedido(
                  stripSurtidoFotoQrFromNotas(detalle.notas_almacen ?? "") ||
                    "",
                  detalle.origen_texto,
                ) || "",
            },
            tomorrowIso: tomorrowIsoDate(),
            todayIso: todayIsoDate(),
          });

          // Preferir ISO de BD; luego origen/adjuntos; luego mapped (puede ser mañana default).
          const fechaDb = toDateInputValue(detalle.fecha_entrega);
          const fechaMapped = isFechaEntregaIsoValida(mapped.fechaEntrega)
            ? mapped.fechaEntrega.trim()
            : "";
          const fechaOrigen = resolveFechaEntregaDesdeOrigen({
            origenCorreo: origenCorreoRows,
            hijas: hijasEdit,
          });
          setFechaEntrega(
            isFechaEntregaIsoValida(fechaDb)
              ? fechaDb
              : fechaOrigen || fechaMapped || "",
          );
          setCentroConsumo(mapped.centroConsumo);
          // REQ-230: lo guardado por el usuario manda sobre lo reconstruido del correo.
          const cabecera = resolveCabeceraGuardada({
            detalle,
            filasOrigen: origenCorreoRows,
            propuesta: mapped,
          });
          setObservaciones(cabecera.observaciones);
          setOrdenCompraHotel(cabecera.ordenCompraHotel);
          setDireccion(mapped.direccion);
          setAnden(mapped.anden);
          setContacto(mapped.contacto);
          setTelefono(mapped.telefono);
          setCorreo(
            mapped.correo.trim() ||
              extractCorreoContactoDesdeTexto(detalle.origen_texto) ||
              "",
          );
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
          if (!mapped.direccion.trim()) nextMissing.add("direccion");
          else nextMissing.delete("direccion");
          setMissingFields(nextMissing);
          setDiscrepancias(mapped.discrepancias);
          if (ovMaterializada) {
            skipOtSeedFromOrigenRef.current = true;
            setLineas(lineasDesdeDetalle());
          } else {
            skipOtSeedFromOrigenRef.current = false;
            setLineas(mapped.lineas.map(lineaFormDesdeIa));
          }
          setStartMode("docs");
          setFormOtPage(0);
          // Sin preview intermedio: formulario de la 1ª OT (Cypher se abre desde la lista).
          setStep("form");

}
