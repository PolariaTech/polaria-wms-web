import {
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import {
  decideOvEditLockMode,
  type OvEditLockDecision,
  type OvEditLockSnapshot,
} from "../utils/pedido/ov-edit-lock";

type LockRow = {
  edit_locked_by: string | null;
  edit_locked_at: string | null;
  edit_locked_nombre: string | null;
};

function mapLockRow(row: LockRow | null | undefined): OvEditLockSnapshot {
  return {
    editLockedBy: row?.edit_locked_by ?? null,
    editLockedAt: row?.edit_locked_at ?? null,
    editLockedNombre: row?.edit_locked_nombre ?? null,
  };
}

export async function peekOvEditLock(params: {
  codigoCuenta: string;
  idOrdenVenta: string;
}): Promise<OvEditLockSnapshot> {
  const rows = await runDomainQuery<LockRow[]>((client) =>
    client
      .from("orden_venta")
      .select("edit_locked_by,edit_locked_at,edit_locked_nombre")
      .eq("codigo_cuenta", params.codigoCuenta)
      .eq("id_orden_venta", params.idOrdenVenta)
      .limit(1),
  );
  return mapLockRow(rows[0]);
}

/**
 * Intenta tomar el soft-lock. Si otro lo tiene vivo → soloLectura.
 * Reentra el mismo usuario o lock caducado → edit.
 */
export async function acquireOvEditLock(params: {
  codigoCuenta: string;
  idOrdenVenta: string;
  idUsuario: string;
  nombreUsuario: string;
  nowMs?: number;
}): Promise<OvEditLockDecision & { snapshot: OvEditLockSnapshot }> {
  const nowMs = params.nowMs ?? Date.now();
  const current = await peekOvEditLock(params);
  const decision = decideOvEditLockMode(current, params.idUsuario, nowMs);
  if (decision.mode === "soloLectura") {
    return { ...decision, snapshot: current };
  }

  const nombre = params.nombreUsuario.trim() || "Usuario";
  const nowIso = new Date(nowMs).toISOString();
  const holderAntes = current.editLockedBy?.trim() || null;

  const updated = await runDomainMutation<LockRow[] | null>((client) => {
    let q = client
      .from("orden_venta")
      .update({
        edit_locked_by: params.idUsuario,
        edit_locked_at: nowIso,
        edit_locked_nombre: nombre,
      })
      .eq("codigo_cuenta", params.codigoCuenta)
      .eq("id_orden_venta", params.idOrdenVenta);

    if (!holderAntes) {
      q = q.is("edit_locked_by", null);
    } else {
      // Propio o extranjero caducado: solo gana si sigue siendo ese holder.
      q = q.eq("edit_locked_by", holderAntes);
    }

    return q.select("edit_locked_by,edit_locked_at,edit_locked_nombre");
  });

  if (updated && updated.length > 0) {
    return {
      mode: "edit",
      holderId: params.idUsuario,
      holderNombre: null,
      snapshot: mapLockRow(updated[0]),
    };
  }

  const after = await peekOvEditLock(params);
  const lost = decideOvEditLockMode(after, params.idUsuario, nowMs);
  return { ...lost, snapshot: after };
}

export async function heartbeatOvEditLock(params: {
  codigoCuenta: string;
  idOrdenVenta: string;
  idUsuario: string;
  nowMs?: number;
}): Promise<boolean> {
  const nowIso = new Date(params.nowMs ?? Date.now()).toISOString();
  const updated = await runDomainMutation<{ id_orden_venta: string }[] | null>(
    (client) =>
      client
        .from("orden_venta")
        .update({ edit_locked_at: nowIso })
        .eq("codigo_cuenta", params.codigoCuenta)
        .eq("id_orden_venta", params.idOrdenVenta)
        .eq("edit_locked_by", params.idUsuario)
        .select("id_orden_venta"),
  );
  return Boolean(updated && updated.length > 0);
}

export async function releaseOvEditLock(params: {
  codigoCuenta: string;
  idOrdenVenta: string;
  idUsuario: string;
}): Promise<void> {
  await runDomainMutation((client) =>
    client
      .from("orden_venta")
      .update({
        edit_locked_by: null,
        edit_locked_at: null,
        edit_locked_nombre: null,
      })
      .eq("codigo_cuenta", params.codigoCuenta)
      .eq("id_orden_venta", params.idOrdenVenta)
      .eq("edit_locked_by", params.idUsuario)
      .select("id_orden_venta"),
  );
}

type LockListRow = LockRow & { id_orden_venta: string };

const LOCK_IN_CHUNK = 80;

/** Lectura liviana de presencia para el listado (poll cada pocos segundos). */
export async function listOvEditLocks(params: {
  codigoCuenta: string;
  ids: readonly string[];
}): Promise<Record<string, OvEditLockSnapshot>> {
  const ids = [...new Set(params.ids.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return {};

  const out: Record<string, OvEditLockSnapshot> = {};
  for (let i = 0; i < ids.length; i += LOCK_IN_CHUNK) {
    const chunk = ids.slice(i, i + LOCK_IN_CHUNK);
    const rows = await runDomainQuery<LockListRow[]>((client) =>
      client
        .from("orden_venta")
        .select(
          "id_orden_venta,edit_locked_by,edit_locked_at,edit_locked_nombre",
        )
        .eq("codigo_cuenta", params.codigoCuenta)
        .in("id_orden_venta", chunk),
    );
    for (const row of rows) {
      out[row.id_orden_venta] = mapLockRow(row);
    }
  }
  return out;
}
