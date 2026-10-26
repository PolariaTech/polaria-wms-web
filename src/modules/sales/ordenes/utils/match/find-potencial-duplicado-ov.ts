/**
 * REQ-151: marca de potencial OV duplicada mientras Mateo aprende.
 * Heurística suave (OCC y/o mismo cliente + mismo día de creación).
 */

export type OvDuplicadoCandidate = {
  idOrdenVenta: string;
  codigo: string;
  occTodas: readonly string[];
  comprador: string;
  /** ISO o fecha parseable (created_at / fecha_pedido). */
  fecha: string;
  estado?: string | null;
};

export type OvDuplicadoAnnotation = {
  potencialDuplicado: boolean;
  /** Códigos de otras OV que parecen el mismo pedido. */
  potencialDuplicadoDe: string[];
};

function normalizeOccToken(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function dayKey(fecha: string): string {
  const trimmed = fecha.trim();
  if (!trimmed) return "";
  const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso?.[1]) return iso[1];
  const t = Date.parse(trimmed);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toISOString().slice(0, 10);
}

function normalizeComprador(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function occTokensOf(row: OvDuplicadoCandidate): string[] {
  const out: string[] = [];
  for (const raw of row.occTodas) {
    const token = normalizeOccToken(raw);
    if (token.length < 4) continue;
    if (token === "—" || token === "-") continue;
    out.push(token);
  }
  return out;
}

/**
 * Anota cada OV del listado si comparte OCC fuerte o mismo cliente+día
 * con otra OV no cancelada.
 */
export function annotatePotencialDuplicadoOv(
  rows: readonly OvDuplicadoCandidate[],
): Map<string, OvDuplicadoAnnotation> {
  const result = new Map<string, OvDuplicadoAnnotation>();
  for (const row of rows) {
    result.set(row.idOrdenVenta, {
      potencialDuplicado: false,
      potencialDuplicadoDe: [],
    });
  }

  const byOcc = new Map<string, OvDuplicadoCandidate[]>();
  const byClienteDia = new Map<string, OvDuplicadoCandidate[]>();

  for (const row of rows) {
    if ((row.estado ?? "").toLowerCase() === "cancelada") continue;
    for (const occ of occTokensOf(row)) {
      const list = byOcc.get(occ) ?? [];
      list.push(row);
      byOcc.set(occ, list);
    }
    const cliente = normalizeComprador(row.comprador);
    const dia = dayKey(row.fecha);
    if (cliente && cliente !== "-" && dia) {
      const key = `${cliente}|${dia}`;
      const list = byClienteDia.get(key) ?? [];
      list.push(row);
      byClienteDia.set(key, list);
    }
  }

  const markPair = (a: OvDuplicadoCandidate, b: OvDuplicadoCandidate) => {
    if (a.idOrdenVenta === b.idOrdenVenta) return;
    const annA = result.get(a.idOrdenVenta)!;
    const annB = result.get(b.idOrdenVenta)!;
    annA.potencialDuplicado = true;
    annB.potencialDuplicado = true;
    if (!annA.potencialDuplicadoDe.includes(b.codigo)) {
      annA.potencialDuplicadoDe.push(b.codigo);
    }
    if (!annB.potencialDuplicadoDe.includes(a.codigo)) {
      annB.potencialDuplicadoDe.push(a.codigo);
    }
  };

  for (const group of byOcc.values()) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        markPair(group[i]!, group[j]!);
      }
    }
  }

  // Cliente+día solo si ambas están por_confirmar (ruido alto si ya confirmadas).
  for (const group of byClienteDia.values()) {
    const pending = group.filter(
      (row) => (row.estado ?? "").toLowerCase() === "por_confirmar",
    );
    if (pending.length < 2) continue;
    // Evitar marcar solo por cliente+día si ya están unidas por OCC.
    for (let i = 0; i < pending.length; i += 1) {
      for (let j = i + 1; j < pending.length; j += 1) {
        const a = pending[i]!;
        const b = pending[j]!;
        const aOcc = new Set(occTokensOf(a));
        const bOcc = new Set(occTokensOf(b));
        const shareOcc = [...aOcc].some((t) => bOcc.has(t));
        if (shareOcc) continue;
        // Sin OCC en ninguna: señal débil pero útil mientras Mateo aprende.
        if (aOcc.size === 0 && bOcc.size === 0) {
          markPair(a, b);
        }
      }
    }
  }

  for (const ann of result.values()) {
    ann.potencialDuplicadoDe.sort();
  }
  return result;
}

/** ¿El borrador actual (OCC / cliente / día) choca con alguna OV existente? */
export function findDuplicadosAgainstDraft(params: {
  draft: {
    occTokens: readonly string[];
    comprador: string;
    fecha: string;
    idOrdenVentaExcluir?: string | null;
  };
  existentes: readonly OvDuplicadoCandidate[];
}): OvDuplicadoCandidate[] {
  const draftOcc = new Set(
    params.draft.occTokens
      .map(normalizeOccToken)
      .filter((t) => t.length >= 4),
  );
  const draftCliente = normalizeComprador(params.draft.comprador);
  const draftDia = dayKey(params.draft.fecha);
  const excluir = params.draft.idOrdenVentaExcluir?.trim() || "";

  return params.existentes.filter((row) => {
    if (excluir && row.idOrdenVenta === excluir) return false;
    if ((row.estado ?? "").toLowerCase() === "cancelada") return false;
    const rowOcc = occTokensOf(row);
    if (draftOcc.size > 0 && rowOcc.some((t) => draftOcc.has(t))) return true;
    if (
      draftCliente &&
      draftDia &&
      draftOcc.size === 0 &&
      normalizeComprador(row.comprador) === draftCliente &&
      dayKey(row.fecha) === draftDia &&
      (row.estado ?? "").toLowerCase() === "por_confirmar"
    ) {
      return true;
    }
    return false;
  });
}
