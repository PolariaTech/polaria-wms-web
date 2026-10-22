"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { withCuentaSchema } from "@/lib/supabase/cuenta-schema";
import {
  formatEstadoOrdenVenta,
  variantEstadoOrdenVenta,
} from "../../../shared/constants/sales-status";
import { emitirOrdenVentaApi } from "../../../shared/services/sales-api.service";
import { getOrdenVentaDetalle } from "../../../shared/services/sales.service";
import {
  autoPrintOrdenVentaTrasEmitir,
  fetchAutoImprimirFlag,
  type AutoPrintOvResult,
} from "../../print/auto-print-ov-tras-emitir";
import { useAuthStore } from "@/stores/auth.store";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaLineaRow,
} from "../../../shared/types/sales.types";
import {
  formatCapturaFecha,
  notaCapturaForLinea,
  parseOrdenVentaCapturaObservaciones,
  stripSurtidoFotoQrFromNotas,
} from "../../utils/build-orden-venta-captura-observaciones";
import { resolveSkuVisible } from "../../utils/resolve-sku-visible";
import {
  cleanCorreoBodyForNotas,
  isCuerpoMensajeFormato,
  looksLikeCorreoCuerpoEnNotas,
  sanitizeNotasGeneralesPedido,
} from "../../utils/texto-origen-pedido";
import { filterLineasByOrdenTrabajoHija } from "../../utils/filter-lineas-by-orden-trabajo";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
  type OrdenTrabajoHija,
} from "../../utils/origen-correo-ordenes-trabajo";
import { OrigenPedidoSourceView } from "../shared/OrigenPedidoBodyView";
import {
  nombresOrigenAdjuntos,
  parseOrigenArchivos,
} from "../../utils/origen-adjuntos";
import {
  formatCompradorOrdenVenta,
  formatOrdenVentaLineaTotal,
  formatOrdenVentaTotal,
  resolveOrdenVentaLineaTitulo,
  sumOrdenVentaCantidadKg,
} from "../../utils/orden-venta-display";
import type { CypherCompanionOtPicker } from "./OrdenVentaCypherDrawer";

interface OrdenVentaDetalleModalProps {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  onClose: () => void;
  onEmitted?: () => void;
  onAutoPrintResult?: (result: AutoPrintOvResult) => void;
  inspect?: boolean;
  /** Cypher abierto en paralelo (mismo id): panel a la izquierda. */
  cypherOpen?: boolean;
  /** Abre/cierra Cypher de esta OV (botón +). */
  onToggleCypher?: () => void;
  /**
   * Publica el selector de OT al Cypher (varias OT): la izquierda muestra la elegida.
   */
  onCompanionOtPickerChange?: (
    picker: CypherCompanionOtPicker | null,
  ) => void;
}

function CaptureSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (collapsible) {
    return (
      <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left polaria-text-label uppercase tracking-wide text-polaria-teal"
          aria-expanded={open}
        >
          <span>{title}</span>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
          )}
        </button>
        {open ? (
          <div className="border-t border-polaria-w-08 p-4">{children}</div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <h3 className="border-b border-polaria-w-08 px-4 py-2.5 polaria-text-label uppercase tracking-wide text-polaria-teal">
        {title}
      </h3>
      <div className="p-4">{children}</div>
    </section>
  );
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="polaria-text-label text-polaria-w-20">{label}</p>
      <div className="mt-1 break-words polaria-text-body-sm font-medium text-polaria-w">
        {children}
      </div>
    </div>
  );
}

function TextValue({ value }: { value: string | undefined }) {
  const trimmed = value?.trim() ?? "";
  return <>{trimmed || "—"}</>;
}

function renderEstadoBadge(estado: string) {
  return (
    <PolariaTableBadge variant={variantEstadoOrdenVenta(estado)}>
      {formatEstadoOrdenVenta(estado)}
    </PolariaTableBadge>
  );
}

function DetalleContent({
  orden,
  hija = null,
}: {
  orden: OrdenVentaDetalleRow;
  hija?: OrdenTrabajoHija | null;
}) {
  const allLineItems = orden.lineas ?? [];
  const lineItems: OrdenVentaLineaRow[] = useMemo(() => {
    // Enriquecer con nombre aunque el SKU esté archivado (ARCH-*), para empatar OT.
    const enriched = allLineItems.map((linea) => ({
      ...linea,
      matchNombre: resolveOrdenVentaLineaTitulo(linea),
      matchCodigo: linea.producto?.sku ?? "",
    }));
    return filterLineasByOrdenTrabajoHija(enriched, hija, {
      emptyFallback: "none",
    });
  }, [allLineItems, hija]);

  const origenRenglonesFallback = useMemo(() => {
    if (lineItems.length > 0) return [];
    if (hija?.renglones?.length) return hija.renglones;
    return parseOrigenCorreoJson(orden.origen_correo);
  }, [hija, lineItems.length, orden.origen_correo]);

  const clienteOrigenFallback = useMemo(() => {
    const fromComprador = formatCompradorOrdenVenta(orden);
    if (fromComprador && fromComprador !== "—") return fromComprador;
    const rows = parseOrigenCorreoJson(orden.origen_correo);
    return (
      rows.map((r) => r["Nombre cliente"]?.trim()).find(Boolean) || "—"
    );
  }, [orden]);

  const fromObs = parseOrdenVentaCapturaObservaciones(orden.observaciones);
  const ventanaFlat =
    orden.ventana_desde?.trim() || orden.ventana_hasta?.trim()
      ? `${orden.ventana_desde?.trim() || "—"} – ${orden.ventana_hasta?.trim() || "—"}`
      : "";
  const captura = {
    ...fromObs,
    prioridad: orden.prioridad?.trim() || fromObs.prioridad,
    ordenCompraHotel:
      hija?.numeroPedido ||
      orden.orden_compra_hotel?.trim() ||
      fromObs.ordenCompraHotel,
    centroConsumo:
      hija?.almacen ||
      orden.centro_consumo?.trim() ||
      fromObs.centroConsumo,
    moneda: orden.moneda?.trim() || fromObs.moneda,
    bodegaDestino:
      orden.bodega_destino_label?.trim() || fromObs.bodegaDestino,
    direccion: orden.direccion_entrega?.trim() || fromObs.direccion,
    anden: orden.anden?.trim() || fromObs.anden,
    contacto:
      hija?.responsableExterno ||
      orden.contacto_entrega?.trim() ||
      fromObs.contacto,
    telefono: orden.telefono_contacto?.trim() || fromObs.telefono,
    turno: orden.turno?.trim() || fromObs.turno,
    horaSalida: orden.hora_salida?.trim() || fromObs.horaSalida,
    chofer: orden.chofer?.trim() || fromObs.chofer,
    unidad: orden.unidad?.trim() || fromObs.unidad,
    aceptaSustituciones:
      orden.acepta_sustituciones?.trim() || fromObs.aceptaSustituciones,
    requiereLote: orden.requiere_lote?.trim() || fromObs.requiereLote,
    registrarTemperatura:
      orden.registrar_temperatura?.trim() || fromObs.registrarTemperatura,
    fechaEntrega:
      hija?.fecha ||
      orden.fecha_entrega?.trim() ||
      fromObs.fechaEntrega,
    ventanaEntrega: ventanaFlat || fromObs.ventanaEntrega,
    notasLineas: orden.notas_lineas?.trim() || fromObs.notasLineas,
    origenTexto: orden.origen_texto?.trim() || fromObs.origenTexto,
    origenArchivos: (() => {
      const fromCol = parseOrigenArchivos(orden.origen_archivos);
      if (fromCol.length > 0) return nombresOrigenAdjuntos(fromCol);
      return fromObs.origenArchivos;
    })(),
  };
  const prioridad = captura.prioridad.trim();
  // Cuerpo: origen_texto / bloque "Pedido original" / observaciones crudas del correo.
  const cuerpoMensaje = (() => {
    const fromOrigen = captura.origenTexto.trim();
    if (fromOrigen) return fromOrigen;
    const obsRaw = (orden.observaciones ?? "").trim();
    const obsParsed = captura.observaciones.trim();
    const candidate =
      (looksLikeCorreoCuerpoEnNotas(obsParsed) || obsParsed.length > 180
        ? obsParsed
        : "") ||
      (looksLikeCorreoCuerpoEnNotas(obsRaw) || obsRaw.length > 180
        ? obsRaw
        : "");
    if (!candidate) return "";
    if (isCuerpoMensajeFormato(candidate)) return candidate;
    return cleanCorreoBodyForNotas(candidate) || candidate;
  })();
  const notasGenerales = sanitizeNotasGeneralesPedido(
    stripSurtidoFotoQrFromNotas(orden.notas_almacen ?? "") ||
      (looksLikeCorreoCuerpoEnNotas(captura.observaciones)
        ? ""
        : captura.observaciones.trim()),
    cuerpoMensaje,
  );
  const pesoHija = lineItems.reduce((s, l) => s + l.cantidad_pedida, 0);
  const totalHija = lineItems.reduce(
    (s, l) => s + l.cantidad_pedida * l.precio_unitario,
    0,
  );

  return (
    <>
      <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3">
        <p className="polaria-text-label uppercase tracking-wide text-polaria-teal">
          Orden de trabajo
        </p>
        <p className="mt-1 polaria-text-body-sm font-semibold text-polaria-w">
          {hija?.label ?? orden.codigo}
        </p>
        {hija?.referenciaPedido ? (
          <p className="mt-1 polaria-text-caption text-polaria-w-50">
            {hija.referenciaPedido}
          </p>
        ) : null}
      </div>

      {cuerpoMensaje || captura.origenArchivos.length > 0 ? (
        <CaptureSection title="De dónde salió este pedido">
          <OrigenPedidoSourceView
            archivos={captura.origenArchivos}
            tieneTexto={Boolean(cuerpoMensaje)}
          />
        </CaptureSection>
      ) : null}

      <CaptureSection title="Datos del pedido">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaField label="Cliente">
            <TextValue value={clienteOrigenFallback} />
          </MetaField>
          <MetaField label="Orden de compra del cliente">
            <TextValue value={captura.ordenCompraHotel} />
          </MetaField>
          <MetaField label="Centro de consumo">
            <TextValue value={captura.centroConsumo} />
          </MetaField>
          <MetaField label="Fecha de creación">
            {formatDateTime(orden.created_at || orden.fecha_pedido)}
          </MetaField>
          <MetaField label="Fecha de entrega">
            <TextValue
              value={
                captura.fechaEntrega
                  ? formatCapturaFecha(captura.fechaEntrega)
                  : ""
              }
            />
          </MetaField>
          <MetaField label="Ventana de entrega">
            <TextValue value={captura.ventanaEntrega} />
          </MetaField>
          <MetaField label="Prioridad">
            {prioridad ? (
              <PolariaTableBadge
                variant={prioridad.toLowerCase() === "urgente" ? "warning" : "neutral"}
              >
                {prioridad}
              </PolariaTableBadge>
            ) : (
              "—"
            )}
          </MetaField>
          <MetaField label="Estado">{renderEstadoBadge(orden.estado)}</MetaField>
          <MetaField label="Moneda">
            <TextValue value={captura.moneda || "MXN"} />
          </MetaField>
          <div className="sm:col-span-3">
            <MetaField label="Notas generales">
              <TextValue value={notasGenerales} />
            </MetaField>
          </div>
        </div>
      </CaptureSection>

      <CaptureSection title="Entrega">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaField label="Dirección de entrega">
            <TextValue value={captura.direccion} />
          </MetaField>
          <MetaField label="Andén / punto de recepción">
            <TextValue value={captura.anden} />
          </MetaField>
          <MetaField label="Contacto del cliente">
            <TextValue value={captura.contacto} />
          </MetaField>
          <MetaField label="Teléfono del contacto">
            <TextValue value={captura.telefono} />
          </MetaField>
        </div>
      </CaptureSection>

      <CaptureSection title="Productos">
        {lineItems.length === 0 && origenRenglonesFallback.length === 0 ? (
          <p className="polaria-text-body-sm text-polaria-w-50">
            Sin líneas registradas.
          </p>
        ) : lineItems.length === 0 ? (
          <div className="overflow-hidden rounded-xl border border-polaria-w-08">
            <p className="border-b border-polaria-t-20 bg-polaria-warning-bg/40 px-3 py-2 polaria-text-caption text-polaria-warning">
              Productos del correo (aún sin ligar al catálogo). Se materializan
              al abrir / confirmar la OV.
            </p>
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[52%]" />
                <col className="w-[24%]" />
                <col className="w-[24%]" />
              </colgroup>
              <thead className="bg-polaria-w-08">
                <tr className="border-b border-polaria-t-20">
                  <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                    Producto
                  </th>
                  <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                    Cantidad
                  </th>
                  <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody>
                {origenRenglonesFallback.map((row, index) => {
                  const qty =
                    typeof row.Cantidad === "number"
                      ? row.Cantidad
                      : Number(String(row.Cantidad ?? "").replace(",", ".")) ||
                        0;
                  const precio =
                    typeof row.Precio === "number"
                      ? row.Precio
                      : Number(String(row.Precio ?? "").replace(",", ".")) ||
                        0;
                  return (
                    <tr
                      key={`origen-${index}-${row.Producto ?? ""}`}
                      className="border-b border-polaria-w-08 last:border-b-0"
                    >
                      <td className="px-3 py-2.5 align-middle">
                        <p className="polaria-text-body-sm font-medium text-polaria-w">
                          {row.Producto?.trim() || "Producto"}
                        </p>
                        <p className="polaria-text-caption text-polaria-w-50">
                          {row["Codigo producto"]?.trim()
                            ? `Cód. ${row["Codigo producto"]}`
                            : "Del correo"}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                        {formatKgEs(qty)} kg
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                        {precio > 0 ? `$${formatPrecioEs(precio)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-polaria-w-08">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[44%]" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="bg-polaria-w-08">
                <tr className="border-b border-polaria-t-20">
                  <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                    Producto
                  </th>
                  <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                    Cantidad
                  </th>
                  <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                    Precio
                  </th>
                  <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                    Importe
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((linea) => {
                  const titulo = resolveOrdenVentaLineaTitulo(linea);
                  const nota = notaCapturaForLinea(captura.notasLineas, {
                    nombre: titulo,
                    cantidad: linea.cantidad_pedida,
                    otId: hija?.id,
                    allowUnscoped: !hija,
                  });
                  const skuVisible = resolveSkuVisible({
                    linea,
                    origenRenglones: hija?.renglones ?? undefined,
                    hija,
                  });
                  return (
                    <tr
                      key={linea.id_linea_orden_venta}
                      className="border-b border-polaria-w-08 last:border-b-0"
                    >
                      <td className="px-3 py-2.5 align-middle">
                        <p className="polaria-text-body-sm font-medium text-polaria-w">
                          {titulo}
                        </p>
                        <p className="polaria-text-caption text-polaria-w-50">
                          {skuVisible ? `SKU ${skuVisible}` : "kg"}
                          {nota ? ` · ${nota}` : null}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                        {formatKgEs(linea.cantidad_pedida)} kg
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                        ${formatPrecioEs(linea.precio_unitario)}
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm font-medium text-polaria-teal">
                        ${formatPrecioEs(formatOrdenVentaLineaTotal(linea))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-polaria-t-20 bg-polaria-w-08 px-3 py-2">
              <p className="polaria-text-caption text-polaria-w-50">
                {lineItems.length === 1
                  ? "1 producto"
                  : `${lineItems.length} productos`}{" "}
                · {formatKgEs(hija ? pesoHija : sumOrdenVentaCantidadKg(orden))} kg
              </p>
              <p className="polaria-text-body-sm text-polaria-w-50">
                Total venta:{" "}
                <span className="font-semibold text-polaria-teal">
                  {hija
                    ? `$${formatPrecioEs(totalHija)}`
                    : formatOrdenVentaTotal(orden)}
                </span>
              </p>
            </div>
          </div>
        )}
      </CaptureSection>

      {/* Cuerpo del correo: solo en Cypher → 01 Correo (no duplicar aquí). */}
    </>
  );
}

export function OrdenVentaDetalleModal({
  idOrdenVenta,
  codigoCuenta,
  onClose,
  onEmitted,
  onAutoPrintResult,
  inspect = false,
  cypherOpen = false,
  onToggleCypher,
  onCompanionOtPickerChange,
}: OrdenVentaDetalleModalProps) {
  const [orden, setOrden] = useState<OrdenVentaDetalleRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmitting, setIsEmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hijaId, setHijaId] = useState<string | null>(null);

  const ordenesTrabajo = useMemo(
    () => groupOrigenCorreoToOrdenesTrabajo(parseOrigenCorreoJson(orden?.origen_correo)),
    [orden?.origen_correo],
  );

  const hijaActiva = useMemo(() => {
    if (ordenesTrabajo.length === 0) return null;
    if (ordenesTrabajo.length === 1) return ordenesTrabajo[0] ?? null;
    if (hijaId) {
      return ordenesTrabajo.find((h) => h.id === hijaId) ?? ordenesTrabajo[0] ?? null;
    }
    return ordenesTrabajo[0] ?? null;
  }, [hijaId, ordenesTrabajo]);

  // El grid de OT vive solo en Cypher; aquí siempre hay OT activa (1ª por defecto).
  useEffect(() => {
    if (ordenesTrabajo.length === 0) return;
    if (hijaId && ordenesTrabajo.some((h) => h.id === hijaId)) return;
    setHijaId(ordenesTrabajo[0]?.id ?? null);
  }, [hijaId, ordenesTrabajo]);

  // Publicar selector de OT al Cypher compañero.
  useEffect(() => {
    if (!onCompanionOtPickerChange) return;

    const shouldPublish =
      Boolean(idOrdenVenta) &&
      cypherOpen &&
      !inspect &&
      ordenesTrabajo.length >= 1;

    if (!shouldPublish) {
      onCompanionOtPickerChange(null);
      return;
    }

    onCompanionOtPickerChange({
      hijas: ordenesTrabajo.map((hija) => ({
        id: hija.id,
        label: hija.label,
        productosCount: hija.renglones.length,
        totalCantidad: hija.totalCantidad,
        almacen: hija.almacen,
      })),
      selectedId: hijaId ?? ordenesTrabajo[0]?.id ?? null,
      onSelect: (id: string) => {
        setHijaId(id);
      },
    });

    return () => {
      onCompanionOtPickerChange(null);
    };
  }, [
    cypherOpen,
    hijaId,
    idOrdenVenta,
    inspect,
    onCompanionOtPickerChange,
    ordenesTrabajo,
  ]);

  const loadDetalle = useCallback(
    (id: string, cuenta: string) => {
      const run = () =>
        getOrdenVentaDetalle({ codigoCuenta: cuenta, idOrdenVenta: id });
      if (inspect) {
        return withCuentaSchema(cuenta, run);
      }
      return run();
    },
    [inspect],
  );

  const reloadDetalle = useCallback(
    (options?: { silent?: boolean }) => {
      if (!idOrdenVenta || !codigoCuenta) return;

      if (!options?.silent) {
        setIsLoading(true);
      }
      setError(null);

      void loadDetalle(idOrdenVenta, codigoCuenta)
        .then((row) => {
          setOrden(row);
          setActionError(null);
        })
        .catch((err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el detalle de la venta.",
          );
        })
        .finally(() => {
          if (!options?.silent) {
            setIsLoading(false);
          }
        });
    },
    [codigoCuenta, idOrdenVenta, loadDetalle],
  );

  useEffect(() => {
    if (!idOrdenVenta || !codigoCuenta) {
      setOrden(null);
      setError(null);
      setActionError(null);
      setHijaId(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setActionError(null);
    setOrden(null);
    setHijaId(null);

    void loadDetalle(idOrdenVenta, codigoCuenta)
      .then((row) => {
        if (!cancelled) {
          setOrden(row);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el detalle de la venta.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, idOrdenVenta, loadDetalle]);

  const puedeEmitir = !inspect && orden?.estado === "por_confirmar";

  const handleEmitir = () => {
    if (!idOrdenVenta || !puedeEmitir || isEmitting) {
      return;
    }

    if (!orden?.id_comprador?.trim()) {
      setActionError(
        "Selecciona un cliente del catálogo antes de confirmar el pedido. Ábrelo en Editar y elige el cliente correcto.",
      );
      return;
    }

    setActionError(null);
    setIsEmitting(true);

    void emitirOrdenVentaApi(idOrdenVenta)
      .then(async (row) => {
        setOrden((prev) =>
          prev
            ? {
                ...prev,
                estado: row.estado,
              }
            : prev,
        );
        const session = useAuthStore.getState().session;
        if (codigoCuenta) {
          // Bitácora de emisión: la escribe el API al confirmar.
          try {
            const shouldAutoPrint = await fetchAutoImprimirFlag(codigoCuenta);
            if (shouldAutoPrint) {
              const autoPrintResult = await autoPrintOrdenVentaTrasEmitir({
                codigoCuenta,
                idOrdenVenta,
                listRowFallback: null,
                autorNombre: session?.nombre ?? null,
                idUsuario: session?.idUsuario ?? null,
                autoImprimirKnown: true,
              });
              if (autoPrintResult.status !== "skipped") {
                onAutoPrintResult?.(autoPrintResult);
              }
            }
          } catch (flagErr) {
            onAutoPrintResult?.({
              status: "error",
              message:
                flagErr instanceof Error
                  ? flagErr.message
                  : "No se pudo leer la configuración de autoimpresión.",
            });
          }
        }
        onEmitted?.();
        reloadDetalle({ silent: true });
      })
      .catch((err: unknown) => {
        setActionError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo emitir la venta.",
        );
      })
      .finally(() => {
        setIsEmitting(false);
      });
  };

  if (!idOrdenVenta) {
    return null;
  }

  return (
    <PolariaFormModal
      open
      onClose={onClose}
      sectionLabel="Detalle de venta"
      title={
        hijaActiva
          ? `${orden?.codigo ?? "OV"} · ${hijaActiva.label}`
          : (orden?.codigo ?? "Orden de venta")
      }
      description={
        orden ? formatCompradorOrdenVenta(orden) : "Ficha de captura del pedido."
      }
      isSubmitting={isEmitting}
      onSubmit={(event) => {
        event.preventDefault();
      }}
      layout={cypherOpen ? "dock-left" : "center"}
      closeOnBackdrop={!cypherOpen}
      hideHeaderClose
      headerTrailing={
        cypherOpen ? undefined : (
          <button
            type="button"
            title={onToggleCypher ? "Ver detalle Cypher" : "Cerrar"}
            aria-label={
              onToggleCypher ? "Abrir detalle Cypher" : "Cerrar detalle"
            }
            onClick={() => {
              if (onToggleCypher) {
                onToggleCypher();
                return;
              }
              onClose();
            }}
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              onToggleCypher
                ? "border-polaria-t-20 bg-transparent text-polaria-teal hover:bg-polaria-t-08"
                : "border-polaria-teal bg-polaria-teal text-polaria-on-teal hover:opacity-90",
            )}
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </button>
        )
      }
      footerAction={
        puedeEmitir ? (
          <button
            type="button"
            onClick={handleEmitir}
            disabled={isLoading || isEmitting}
            className={cn(
              "inline-flex min-w-[7rem] items-center justify-center rounded-xl bg-polaria-teal px-4 py-2.5",
              "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {isEmitting ? "Emitiendo…" : "Emitir venta"}
          </button>
        ) : (
          <></>
        )
      }
      compact
      size="2xl"
    >
      {isLoading ? (
        <PolariaStatusLoading embedded className="py-4" />
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger"
        >
          {error}
        </p>
      ) : null}

      {actionError ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger"
        >
          {actionError}
        </p>
      ) : null}

      {!isLoading && !error && orden ? (
        <div className="space-y-3">
          {ordenesTrabajo.length > 1 ? (
            <p className="polaria-text-caption text-polaria-w-50">
              {cypherOpen
                ? "Cambia de orden de trabajo en Cypher (Confirmación)."
                : `${ordenesTrabajo.length} órdenes de trabajo · ábrelas con + en Cypher.`}
            </p>
          ) : null}
          <DetalleContent orden={orden} hija={hijaActiva} />
        </div>
      ) : null}
    </PolariaFormModal>
  );
}
