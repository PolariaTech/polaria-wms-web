export type MateoCoincidenciaKind =
  | "exacta"
  | "similar"
  | "sin_coincidencia"
  | "no_venia"
  | "pendiente";

export function labelMateoCoincidencia(kind: MateoCoincidenciaKind): string {
  switch (kind) {
    case "exacta":
      return "Exacta";
    case "similar":
      return "Similar";
    case "sin_coincidencia":
      return "Sin coincidencia (catálogo)";
    case "no_venia":
      return "No venía en el correo";
    default:
      return "Pendiente";
  }
}

export function badgeVariantMateoCoincidencia(
  kind: MateoCoincidenciaKind,
): "positive" | "warning" | "danger" | "neutral" {
  switch (kind) {
    case "exacta":
      return "positive";
    case "similar":
      return "warning";
    case "sin_coincidencia":
      return "danger";
    default:
      return "neutral";
  }
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

function significantTokens(value: string): string[] {
  return normalizeKey(value)
    .split(" ")
    .filter((token) => token.length >= 3);
}

/** Comparación laxa para badges Correo ↔ Mateo ↔ Usuario. */
export function resolveMateoCoincidencia(input: {
  correo?: string | null;
  mateo?: string | null;
  usuario?: string | null;
  /** Si hay ids de producto/comprador y coinciden → Exacta. */
  idsMatch?: boolean | null;
  /** Mateo no propuso nada (producto). */
  mateoSinPropuesta?: boolean;
}): MateoCoincidenciaKind {
  const correo = (input.correo ?? "").trim();
  const mateo = (input.mateo ?? "").trim();
  const usuario = (input.usuario ?? "").trim();

  if (input.idsMatch === true) return "exacta";

  if (!correo && !mateo && !usuario) return "pendiente";
  if (!correo && (mateo || usuario)) return "no_venia";

  const c = normalizeKey(correo);
  const m = normalizeKey(mateo);
  const u = normalizeKey(usuario);

  if (c && m && c === m) return "exacta";
  if (u && (u === c || u === m)) return "exacta";

  if (input.mateoSinPropuesta && correo) return "sin_coincidencia";

  if (c && m) {
    const cTokens = significantTokens(correo);
    const mTokens = significantTokens(mateo);
    const softShare = cTokens.some((ct) =>
      mTokens.some((mt) => {
        if (ct === mt) return true;
        if (ct.length >= 4 && mt.length >= 4) {
          return ct.startsWith(mt) || mt.startsWith(ct);
        }
        return false;
      }),
    );
    // REQ-115: cebolla vs aguacate (sin overlap) → sin coincidencia.
    if (!softShare) {
      const distinctiveC = cTokens.filter((t) => t.length >= 5);
      const distinctiveM = mTokens.filter((t) => t.length >= 5);
      if (distinctiveC.length > 0 && distinctiveM.length > 0) {
        return "sin_coincidencia";
      }
    } else {
      return "similar";
    }
  }

  if (correo && !mateo && !usuario) return "pendiente";
  if (correo && mateo && usuario && u !== c && u !== m) return "similar";

  return correo && !mateo ? "sin_coincidencia" : "similar";
}

export function displayOrDash(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed || "—";
}

export function displayOrPendiente(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed || "Pendiente";
}
