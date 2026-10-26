"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { listCompradoresAdmin } from "@/modules/admin-panel/compradores/services/compradores.service";
import type { CompradorListRow } from "@/modules/admin-panel/compradores/services/compradores.service";
import { normalizeEstadoOrdenVenta } from "../../../shared/constants/sales-status";
import { fetchProductosVentaCatalogo } from "../../../shared/services/sales-catalog.api";
import type {
  OrdenVentaDetalleRow,
  ProductoVentaOption,
} from "../../../shared/types/sales.types";
import { rankProductosCatalogo } from "../../utils/match/find-closest-producto-catalogo";
import { scoreMatch } from "../../utils/ot/filter-lineas-by-orden-trabajo";
import { rankCompradoresFromNombre } from "../../utils/match/match-comprador-from-nombre";
import {
  badgeVariantMateoCoincidencia,
  displayOrDash,
  displayOrPendiente,
  labelMateoCoincidencia,
  resolveMateoCoincidencia,
  type MateoCoincidenciaKind,
} from "../../utils/match/mateo-coincidencia";
import { formatCompradorOrdenVenta } from "../../utils/display/orden-venta-display";
import {
  parseOrigenCorreoJson,
  type OrdenTrabajoHija,
  type OrigenCorreoRenglon,
} from "../../utils/origen/origen-correo-ordenes-trabajo";
import { resolveOrdenCompraLimpia } from "../../utils/pedido/normalize-numero-pedido";
import { buildPedidoExtraidoFromOrigenCorreo } from "../../utils/origen/pedido-from-origen-correo";

/** Solo tras confirmar: en por_confirmar el usuario aún no eligió. */
function usuarioSiConfirmado(confirmado: boolean, value: string): string {
  return confirmado ? value : "";
}

type CompareRow = {
  campo: string;
  correo: string;
  mateo: string;
  usuario: string;
  coincidencia: MateoCoincidenciaKind;
  group?: string;
};

type MateoSuggestContext = {
  productos: readonly ProductoVentaOption[];
  compradores: readonly CompradorListRow[];
};

function firstNonEmpty(values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Mateo solo muestra sugerencia real (catálogo / interpretación).
 * Si es un eco del correo → vacío (= «Sin propuesta» en UI).
 */
function mateoSoloSugerencia(sugerido: string, correo: string): string {
  const value = sugerido.trim();
  if (!value) return "";
  if (normalizeKey(value) === normalizeKey(correo)) return "";
  return value;
}

function formatMateoRef(ref: {
  nombre?: string | null;
  codigo?: string | null;
} | null | undefined): string {
  if (!ref) return "";
  const nombre = (ref.nombre ?? "").trim();
  const codigo = (ref.codigo ?? "").trim();
  if (nombre && codigo) return `${nombre} (${codigo})`;
  return nombre || codigo;
}

function suggestProductoMateo(
  textoCorreo: string,
  matchSugerido: string,
  catalogo: readonly ProductoVentaOption[],
): { label: string; producto: ProductoVentaOption | null } {
  if (matchSugerido.trim()) {
    return { label: matchSugerido.trim(), producto: null };
  }
  const query = textoCorreo.trim();
  if (!query || catalogo.length === 0) {
    return { label: "", producto: null };
  }
  const ranked = rankProductosCatalogo(query, catalogo);
  const best = ranked.best ?? ranked.candidates[0]?.producto ?? null;
  if (!best) return { label: "", producto: null };
  const label = firstNonEmpty([best.nombre, best.codigo]);
  return {
    label: mateoSoloSugerencia(label, textoCorreo) || label,
    producto: best,
  };
}

function ComparisonTable({
  title,
  rows,
}: {
  title: string;
  rows: readonly CompareRow[];
}) {
  return (
    <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <div className="border-b border-polaria-t-20 px-3 py-2.5">
        <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-50">
          {title}
        </p>
      </div>
      <div className="overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
        <table className="w-max min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-polaria-w-08">
              {(
                ["Campo", "Correo", "Mateo", "Usuario", "Coincidencia"] as const
              ).map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-3 py-2 polaria-text-caption font-medium uppercase tracking-[0.08em] text-polaria-w-50"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const campoLabel = row.group
                ? `${row.group} · ${row.campo}`
                : row.campo;
              return (
                <tr
                  key={`${row.group ?? "g"}-${row.campo}-${index}`}
                  className="border-b border-polaria-w-08 last:border-b-0"
                >
                  <td className="whitespace-nowrap px-3 py-2 align-middle polaria-text-caption font-medium text-polaria-w-50">
                    {row.group ? (
                      <>
                        <span className="font-semibold text-polaria-teal">
                          {row.group}
                        </span>
                        <span className="text-polaria-w-20"> · </span>
                        <span>{row.campo}</span>
                      </>
                    ) : (
                      campoLabel
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle font-mono text-[11.5px] text-polaria-w-50">
                    {displayOrDash(row.correo)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle font-mono text-[11.5px] text-polaria-w">
                    {row.mateo.trim() || "Sin propuesta"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle font-mono text-[11.5px] text-polaria-w">
                    {displayOrPendiente(row.usuario)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle">
                    <PolariaTableBadge
                      variant={badgeVariantMateoCoincidencia(row.coincidencia)}
                    >
                      {labelMateoCoincidencia(row.coincidencia)}
                    </PolariaTableBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildGeneralesRows(
  orden: OrdenVentaDetalleRow,
  usuarioConfirmado: boolean,
  ctx: MateoSuggestContext,
): CompareRow[] {
  const origenRows = parseOrigenCorreoJson(orden.origen_correo);
  const pedido = buildPedidoExtraidoFromOrigenCorreo({
    origenCorreo: orden.origen_correo,
    origenTexto: orden.origen_texto,
    notasAlmacen: orden.notas_almacen,
  });

  const correoCliente = firstNonEmpty([
    ...origenRows.map((row) => row["Nombre cliente"]),
    pedido.nombreCliente,
  ]);
  const compradorRank = rankCompradoresFromNombre(
    correoCliente || pedido.nombreCliente,
    ctx.compradores,
  );
  const mateoCliente = firstNonEmpty([
    compradorRank.best?.comprador,
    compradorRank.exact?.comprador,
  ]);
  const usuarioCliente = usuarioSiConfirmado(
    usuarioConfirmado,
    formatCompradorOrdenVenta(orden),
  );

  const correoOccRaw = firstNonEmpty([
    ...origenRows.map((row) => row["Numero pedido"]),
    pedido.ordenCompraHotel,
  ]);
  // No mostrar basura OCR (rAutorizado) como si fuera OCC del correo.
  const correoOcc = resolveOrdenCompraLimpia(
    correoOccRaw,
    orden.origen_texto ?? pedido.textoOrigen ?? "",
  );
  // OCC interpretada/normalizada por Mateo (solo si aporta algo distinto).
  const mateoOcc = mateoSoloSugerencia(
    resolveOrdenCompraLimpia(
      pedido.ordenCompraHotel,
      orden.origen_texto ?? pedido.textoOrigen ?? "",
    ),
    correoOcc,
  );
  const usuarioOcc = usuarioSiConfirmado(
    usuarioConfirmado,
    resolveOrdenCompraLimpia(
      orden.orden_compra_hotel,
      orden.origen_texto ?? "",
    ),
  );

  const correoFecha = firstNonEmpty([
    ...origenRows.map((row) => row.Fecha),
    ...origenRows.map((row) => row.Horario),
  ]);
  const mateoFecha = pedido.fechaEntrega?.trim()
    ? formatDateTime(pedido.fechaEntrega)
    : "";
  const usuarioFecha = usuarioSiConfirmado(
    usuarioConfirmado,
    orden.fecha_entrega?.trim() ? formatDateTime(orden.fecha_entrega) : "",
  );

  return [
    {
      campo: "Cliente",
      correo: correoCliente,
      mateo: mateoCliente,
      usuario: usuarioCliente,
      coincidencia: resolveMateoCoincidencia({
        correo: correoCliente,
        mateo: mateoCliente,
        usuario: usuarioCliente,
        mateoSinPropuesta: !mateoCliente,
      }),
    },
    {
      campo: "OCC",
      correo: correoOcc,
      mateo: mateoOcc,
      usuario: usuarioOcc,
      coincidencia: resolveMateoCoincidencia({
        correo: correoOcc,
        mateo: mateoOcc,
        usuario: usuarioOcc,
        mateoSinPropuesta: !mateoOcc,
      }),
    },
    {
      campo: "Fecha de entrega",
      correo: correoFecha,
      mateo: mateoFecha,
      usuario: usuarioFecha,
      coincidencia: resolveMateoCoincidencia({
        correo: correoFecha,
        mateo: mateoFecha,
        usuario: usuarioFecha,
        mateoSinPropuesta: !mateoFecha,
      }),
    },
  ];
}

function formatCantidadCorreo(value: number | string | undefined): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatKgEs(value);
  }
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function formatPrecioCorreo(value: number | string | undefined): string {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return `$${formatPrecioEs(value)}`;
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(",", ".").trim());
    if (Number.isFinite(n) && n > 0) return `$${formatPrecioEs(n)}`;
    return value.trim();
  }
  return "";
}

function buildOtRows(
  orden: OrdenVentaDetalleRow,
  hija: OrdenTrabajoHija,
  otIndex: number,
  usuarioConfirmado: boolean,
  ctx: MateoSuggestContext,
): CompareRow[] {
  const lineas = orden.lineas ?? [];
  const used = new Set<number>();
  const out: CompareRow[] = [];

  const correoDestino = firstNonEmpty([
    hija.almacen,
    hija.renglones[0]?.Destino,
    hija.renglones[0]?.["Direccion entrega"],
  ]);
  // Destino no tiene catálogo aparte: no eco del correo.
  const mateoDestino = "";
  const usuarioDestino = usuarioSiConfirmado(
    usuarioConfirmado,
    firstNonEmpty([
      orden.centro_consumo,
      orden.direccion_entrega,
      orden.bodega_destino_nombre,
    ]),
  );

  out.push({
    campo: "Destino",
    correo: correoDestino,
    mateo: mateoDestino,
    usuario: usuarioDestino,
    coincidencia: resolveMateoCoincidencia({
      correo: correoDestino,
      mateo: mateoDestino,
      usuario: usuarioDestino,
      mateoSinPropuesta: true,
    }),
    group: `OT ${otIndex + 1}`,
  });

  hija.renglones.forEach((renglon: OrigenCorreoRenglon, lineIndex) => {
    let bestIndex = -1;
    let bestScore = -1;
    for (let i = 0; i < lineas.length; i++) {
      if (used.has(i)) continue;
      const linea = lineas[i]!;
      const score = scoreMatch(
        {
          cantidad_pedida: linea.cantidad_pedida,
          matchNombre: linea.match_producto?.elegidoUsuario.nombre,
          matchCodigo: linea.match_producto?.elegidoUsuario.codigo,
          producto: linea.producto,
        },
        renglon,
      );
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    const linea = bestIndex >= 0 ? lineas[bestIndex]! : null;
    if (bestIndex >= 0) used.add(bestIndex);

    const match = linea?.match_producto ?? null;
    const group = `L${lineIndex + 1}`;

    const correoProducto = firstNonEmpty([
      match?.textoCliente,
      renglon.Producto,
      renglon["Codigo producto"],
    ]);
    const fromPersist = formatMateoRef(match?.sugeridoMateo);
    const suggested = suggestProductoMateo(
      correoProducto,
      fromPersist,
      ctx.productos,
    );
    const mateoProducto = suggested.label;
    const usuarioProducto = usuarioSiConfirmado(
      usuarioConfirmado,
      firstNonEmpty([
        formatMateoRef(match?.elegidoUsuario),
        linea?.producto?.descripcion,
        linea?.producto?.sku,
      ]),
    );
    const idsMatch = Boolean(
      usuarioConfirmado &&
        match?.sugeridoMateo?.idProducto &&
        match.elegidoUsuario.idProducto &&
        match.sugeridoMateo.idProducto === match.elegidoUsuario.idProducto,
    );

    out.push({
      campo: "Producto",
      group,
      correo: correoProducto,
      mateo: mateoProducto,
      usuario: usuarioProducto,
      coincidencia: resolveMateoCoincidencia({
        correo: correoProducto,
        mateo: mateoProducto,
        usuario: usuarioProducto,
        idsMatch,
        mateoSinPropuesta: !mateoProducto,
      }),
    });

    const correoCantidad = formatCantidadCorreo(renglon.Cantidad);
    // Cantidad: Mateo no “sugiere” eco del correo.
    const mateoCantidad = "";
    const usuarioCantidad = usuarioSiConfirmado(
      usuarioConfirmado,
      linea != null ? formatKgEs(linea.cantidad_pedida) : "",
    );

    out.push({
      campo: "Cantidad",
      group,
      correo: correoCantidad,
      mateo: mateoCantidad,
      usuario: usuarioCantidad,
      coincidencia: resolveMateoCoincidencia({
        correo: correoCantidad,
        mateo: mateoCantidad,
        usuario: usuarioCantidad,
        mateoSinPropuesta: true,
      }),
    });

    const correoUnidad = (renglon.Unidad ?? "").toString().trim();
    const unidadCatalogo = (suggested.producto?.unidadMedida ?? "").trim();
    const mateoUnidad = mateoSoloSugerencia(unidadCatalogo, correoUnidad);
    const usuarioUnidad = usuarioSiConfirmado(
      usuarioConfirmado,
      firstNonEmpty([linea?.unidad_medida, linea?.presentacion]),
    );

    out.push({
      campo: "Unidad",
      group,
      correo: correoUnidad,
      mateo: mateoUnidad,
      usuario: usuarioUnidad,
      coincidencia: resolveMateoCoincidencia({
        correo: correoUnidad,
        mateo: mateoUnidad,
        usuario: usuarioUnidad,
        mateoSinPropuesta: !mateoUnidad,
      }),
    });

    const correoPrecio = formatPrecioCorreo(renglon.Precio);
    const precioCatalogo =
      suggested.producto && Number(suggested.producto.precioUnitario) > 0
        ? `$${formatPrecioEs(suggested.producto.precioUnitario)}`
        : "";
    const mateoPrecio = mateoSoloSugerencia(precioCatalogo, correoPrecio);
    const usuarioPrecio = usuarioSiConfirmado(
      usuarioConfirmado,
      linea != null && Number(linea.precio_unitario) > 0
        ? `$${formatPrecioEs(linea.precio_unitario)}`
        : "",
    );

    out.push({
      campo: "Precio unitario",
      group,
      correo: correoPrecio,
      mateo: mateoPrecio,
      usuario: usuarioPrecio,
      coincidencia: resolveMateoCoincidencia({
        correo: correoPrecio,
        mateo: mateoPrecio,
        usuario: usuarioPrecio,
        mateoSinPropuesta: !mateoPrecio,
      }),
    });
  });

  return out;
}

export function CypherClienteVsMateoSection({
  orden,
  hijas,
}: {
  orden: OrdenVentaDetalleRow;
  hijas: readonly OrdenTrabajoHija[];
}): ReactNode {
  const [productos, setProductos] = useState<ProductoVentaOption[]>([]);
  const [compradores, setCompradores] = useState<CompradorListRow[]>([]);

  useEffect(() => {
    const codigoCuenta = orden.codigo_cuenta?.trim();
    if (!codigoCuenta) {
      setProductos([]);
      setCompradores([]);
      return;
    }
    let cancelled = false;
    void Promise.all([
      fetchProductosVentaCatalogo(codigoCuenta),
      listCompradoresAdmin({ codigoCuenta, soloActivos: true }),
    ])
      .then(([nextProductos, nextCompradores]) => {
        if (cancelled) return;
        setProductos(nextProductos);
        setCompradores(nextCompradores);
      })
      .catch(() => {
        if (cancelled) return;
        setProductos([]);
        setCompradores([]);
      });
    return () => {
      cancelled = true;
    };
  }, [orden.codigo_cuenta]);

  const usuarioConfirmado = useMemo(
    () => normalizeEstadoOrdenVenta(orden.estado) !== "por_confirmar",
    [orden.estado],
  );
  const ctx = useMemo(
    (): MateoSuggestContext => ({ productos, compradores }),
    [productos, compradores],
  );
  const generales = useMemo(
    () => buildGeneralesRows(orden, usuarioConfirmado, ctx),
    [orden, usuarioConfirmado, ctx],
  );
  const otBlocks = useMemo(
    () =>
      hijas.map((hija, index) => ({
        id: hija.id,
        title: hija.label?.trim() || `Orden de trabajo ${index + 1}`,
        rows: buildOtRows(orden, hija, index, usuarioConfirmado, ctx),
      })),
    [hijas, orden, usuarioConfirmado, ctx],
  );

  const empty =
    generales.every((row) => !row.correo && !row.mateo && !row.usuario) &&
    otBlocks.length === 0;

  if (empty) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
        Sin datos de comparación Correo / Mateo / Usuario para esta OV.
      </p>
    );
  }

  return (
    <div className={cn("mt-3 space-y-4")}>
      <ComparisonTable title="Datos generales" rows={generales} />
      {otBlocks.map((block) => (
        <ComparisonTable
          key={block.id}
          title={block.title}
          rows={block.rows}
        />
      ))}
    </div>
  );
}
