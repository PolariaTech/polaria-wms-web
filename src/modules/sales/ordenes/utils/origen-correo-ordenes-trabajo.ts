/**
 * Agrupa renglones de origen_correo en órdenes de trabajo (hijas) de una OV.
 *
 * Clave = Numero pedido + Almacen (centro de consumo).
 * Así un mismo PO con varios almacenes (AVA) genera varias hijas,
 * y varios PO con el mismo almacén (Marina) también.
 */

export interface OrigenCorreoRenglon {
  Fecha?: string;
  Unidad?: string;
  Almacen?: string;
  Horario?: string;
  Cantidad?: number | string;
  Producto?: string;
  /** Precio unitario del documento (si venía en el PDF/correo). */
  Precio?: number | string;
  "Numero correo"?: string;
  "Numero pedido"?: string;
  "Nombre cliente"?: string;
  "Numero almacen"?: string;
  "Codigo producto"?: string;
  "Referencia pedido"?: string;
  "Responsable externo"?: string;
  "Responsable interno"?: string;
  "Referencia del cliente"?: string;
  /** Ventana de entrega (hora desde), ej. "06:00". */
  "Ventana desde"?: string;
  /** Ventana de entrega (hora hasta), ej. "06:00". */
  "Ventana hasta"?: string;
  /** Dirección / destino de entrega. */
  "Direccion entrega"?: string;
  /** Destino corto (ej. Parque Xcaret) si no hay dirección completa. */
  Destino?: string;
  /** Andén / punto de recepción. */
  Anden?: string;
  /** Teléfono del contacto de entrega. */
  "Telefono contacto"?: string;
  /** Correo del contacto de entrega. */
  "Correo contacto"?: string;
  /** Prioridad del pedido (Normal / Urgente). */
  Prioridad?: string;
  /** Notas generales / instrucciones de entrega. */
  "Notas generales"?: string;
  /** Índice en el array original / vínculo con línea del formulario. */
  _lineaIndex?: number;
  /**
   * Id estable de orden de trabajo (manual o preservado tras editar).
   * Si está presente, agrupa por este valor en vez de pedido+almacén.
   */
  _otId?: string;
}

export interface OrdenTrabajoHija {
  id: string;
  label: string;
  numeroPedido: string;
  almacen: string;
  referenciaPedido: string;
  fecha: string;
  responsableExterno: string;
  renglones: OrigenCorreoRenglon[];
  totalCantidad: number;
}

function norm(value: string | null | undefined): string {
  return (value ?? "").toString().trim();
}

function normKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseCantidad(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(",", ".").trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function groupKeyOrigenCorreo(renglon: OrigenCorreoRenglon): string {
  const otId = norm(renglon._otId);
  if (otId) return otId;

  const pedido = norm(renglon["Numero pedido"]);
  const almacen = norm(renglon.Almacen);
  const referencia = norm(renglon["Referencia pedido"]);

  if (pedido || almacen) {
    return `pedido:${pedido ? normKey(pedido) : "_"}|almacen:${almacen ? normKey(almacen) : "_"}`;
  }
  if (referencia) return `ref:${normKey(referencia)}`;
  return "default";
}

function labelFromGroup(
  key: string,
  renglones: OrigenCorreoRenglon[],
): string {
  const first = renglones[0];
  if (!first) return "Orden de trabajo";
  const pedido = norm(first["Numero pedido"]);
  const ref = norm(first["Referencia pedido"]);
  const almacen = norm(first.Almacen);

  let destino = almacen;
  if (!destino && ref) {
    const m = ref.match(/FYV\s+(.+?)\s+PARA\s+ENTREGA/i);
    destino = m?.[1]?.trim() || ref;
  }

  if (pedido && destino) return `${pedido} — ${destino}`;
  if (destino) return destino;
  if (pedido) return pedido;
  if (key === "default") return "Orden de trabajo";
  return key.replace(/^(pedido|almacen|ref):/, "");
}

export function groupOrigenCorreoToOrdenesTrabajo(
  renglones: readonly OrigenCorreoRenglon[] | null | undefined,
): OrdenTrabajoHija[] {
  if (!renglones || renglones.length === 0) return [];

  const buckets = new Map<string, OrigenCorreoRenglon[]>();
  for (const row of renglones) {
    const key = groupKeyOrigenCorreo(row);
    const list = buckets.get(key);
    if (list) list.push(row);
    else buckets.set(key, [row]);
  }

  const hijas: OrdenTrabajoHija[] = [];
  for (const [key, rows] of buckets) {
    const first = rows[0]!;
    hijas.push({
      id: key,
      label: labelFromGroup(key, rows),
      numeroPedido: norm(first["Numero pedido"]),
      almacen: norm(first.Almacen),
      referenciaPedido: norm(first["Referencia pedido"]),
      fecha: norm(first.Fecha),
      responsableExterno: norm(first["Responsable externo"]),
      renglones: rows,
      totalCantidad: rows.reduce(
        (sum, row) => sum + parseCantidad(row.Cantidad),
        0,
      ),
    });
  }

  return hijas.sort((a, b) => a.label.localeCompare(b.label, "es"));
}

function newManualOtId(): string {
  const uuid =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `ot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `manual:${uuid}`;
}

/** Crea una OT vacía (para que el operador agregue tareas que Mateo no detectó). */
export function createEmptyOrdenTrabajoHija(input?: {
  id?: string;
  almacen?: string;
  numeroPedido?: string;
  fecha?: string;
  referenciaPedido?: string;
  responsableExterno?: string;
}): OrdenTrabajoHija {
  const id = norm(input?.id) || newManualOtId();
  const almacen = norm(input?.almacen);
  const numeroPedido = norm(input?.numeroPedido);
  const fecha = norm(input?.fecha);
  const referenciaPedido = norm(input?.referenciaPedido);
  const responsableExterno = norm(input?.responsableExterno);
  const renglon: OrigenCorreoRenglon = {
    _otId: id,
    Almacen: almacen,
    "Numero pedido": numeroPedido,
    Fecha: fecha,
    "Referencia pedido": referenciaPedido,
    "Responsable externo": responsableExterno,
    Producto: "",
    Cantidad: 0,
  };
  const label =
    (numeroPedido && almacen
      ? `${numeroPedido} — ${almacen}`
      : almacen || numeroPedido) || "Nueva orden de trabajo";
  return {
    id,
    label,
    numeroPedido,
    almacen,
    referenciaPedido,
    fecha,
    responsableExterno,
    renglones: [renglon],
    totalCantidad: 0,
  };
}

/** Aplana hijas → origen_correo, sellando `_otId` para no perder OTs manuales. */
export function flattenOrdenesTrabajoToOrigenCorreo(
  hijas: readonly OrdenTrabajoHija[],
): OrigenCorreoRenglon[] {
  const out: OrigenCorreoRenglon[] = [];
  for (const hija of hijas) {
    const rows =
      hija.renglones.length > 0
        ? hija.renglones
        : [{ Producto: "", Cantidad: 0 }];
    for (const row of rows) {
      out.push({
        ...row,
        _otId: hija.id,
        Almacen: hija.almacen || row.Almacen,
        "Numero pedido": hija.numeroPedido || row["Numero pedido"],
        Fecha: hija.fecha || row.Fecha,
        "Referencia pedido":
          hija.referenciaPedido || row["Referencia pedido"],
        "Responsable externo":
          hija.responsableExterno || row["Responsable externo"],
      });
    }
  }
  return out;
}

export type LineaOrigenOtSync = {
  otId?: string;
  nombre: string;
  codigo: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  aliasCliente?: string;
};

/**
 * Arma origen_correo desde las OTs editadas + líneas del formulario.
 * Prioriza productos del form por otId; si una OT no tiene líneas, conserva sus renglones.
 */
export function buildOrigenCorreoFromOrdenesYLineas(params: {
  hijas: readonly OrdenTrabajoHija[];
  lineas: readonly LineaOrigenOtSync[];
}): OrigenCorreoRenglon[] {
  const out: OrigenCorreoRenglon[] = [];
  for (const hija of params.hijas) {
    const lineasOt = params.lineas.filter((linea) => linea.otId === hija.id);
    if (lineasOt.length > 0) {
      for (const linea of lineasOt) {
        out.push({
          _otId: hija.id,
          Almacen: hija.almacen,
          "Numero pedido": hija.numeroPedido,
          Fecha: hija.fecha,
          "Referencia pedido": hija.referenciaPedido,
          "Responsable externo": hija.responsableExterno,
          Producto: linea.aliasCliente?.trim() || linea.nombre,
          "Codigo producto": linea.codigo,
          Cantidad: linea.cantidad,
          Unidad: linea.unidadMedida,
          Precio: linea.precioUnitario,
        });
      }
      continue;
    }

    const rows =
      hija.renglones.length > 0
        ? hija.renglones
        : [{ Producto: "", Cantidad: 0 }];
    for (const row of rows) {
      out.push({
        ...row,
        _otId: hija.id,
        Almacen: hija.almacen || row.Almacen,
        "Numero pedido": hija.numeroPedido || row["Numero pedido"],
        Fecha: hija.fecha || row.Fecha,
        "Referencia pedido":
          hija.referenciaPedido || row["Referencia pedido"],
        "Responsable externo":
          hija.responsableExterno || row["Responsable externo"],
      });
    }
  }
  return out;
}

export function isOrigenCorreoArray(value: unknown): value is OrigenCorreoRenglon[] {
  return Array.isArray(value);
}

export function parseOrigenCorreoJson(
  value: unknown,
): OrigenCorreoRenglon[] {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return isOrigenCorreoArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return isOrigenCorreoArray(value) ? value : [];
}

/** Normaliza la clave OT usada en QR / captura. */
export function normalizeIdOrdenTrabajo(
  value: string | null | undefined,
): string {
  return (value ?? "").trim();
}

/**
 * Parsea la clave `pedido:…|almacen:…` (o `ref:…`) a campos legibles.
 * El almacén de la clave es el centro de consumo de la OT.
 */
export function parseIdOrdenTrabajoFields(idOrdenTrabajo: string): {
  numeroPedido: string;
  centroConsumo: string;
  label: string;
} {
  const raw = normalizeIdOrdenTrabajo(idOrdenTrabajo);
  if (!raw) {
    return {
      numeroPedido: "",
      centroConsumo: "",
      label: "Hoja (sin OT)",
    };
  }

  const pedidoMatch = raw.match(/pedido:([^|]+)/i);
  const almacenMatch = raw.match(/almacen:([^|]+)/i);
  const refMatch = raw.match(/ref:([^|]+)/i);

  const numeroPedido = (pedidoMatch?.[1] ?? "").trim();
  const centroConsumo = (almacenMatch?.[1] ?? "").trim();
  const referencia = (refMatch?.[1] ?? "").trim();

  const pedido =
    numeroPedido && numeroPedido !== "_" ? numeroPedido : "";
  const centro =
    centroConsumo && centroConsumo !== "_" ? centroConsumo : "";

  if (pedido && centro) {
    return {
      numeroPedido: pedido,
      centroConsumo: centro,
      label: `${pedido} — ${centro}`,
    };
  }
  if (centro) {
    return { numeroPedido: pedido, centroConsumo: centro, label: centro };
  }
  if (pedido) {
    return { numeroPedido: pedido, centroConsumo: "", label: pedido };
  }
  if (referencia && referencia !== "_") {
    return {
      numeroPedido: "",
      centroConsumo: "",
      label: referencia,
    };
  }
  return { numeroPedido: "", centroConsumo: "", label: raw };
}
