const MESES: Record<string, number> = {
  enero: 1,
  february: 2,
  febrero: 2,
  marzo: 3,
  march: 3,
  abril: 4,
  april: 4,
  mayo: 5,
  may: 5,
  junio: 6,
  june: 6,
  julio: 7,
  july: 7,
  agosto: 8,
  august: 8,
  septiembre: 9,
  setiembre: 9,
  september: 9,
  octubre: 10,
  october: 10,
  noviembre: 11,
  november: 11,
  diciembre: 12,
  december: 12,
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatIso(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function quitarAcentos(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Normaliza "6:00 am", "14h", "7" → HH:MM. */
export function normalizarHoraAHhMm(
  hora: string,
  minuto: string | undefined,
  ampm: string | undefined,
): string | null {
  let h = Number(hora);
  const m = minuto != null && minuto !== "" ? Number(minuto) : 0;
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 24 || m < 0 || m > 59) {
    return null;
  }
  const mer = (ampm ?? "").replace(/\./g, "").toLowerCase();
  if (mer === "pm" || mer === "p") {
    if (h < 12) h += 12;
  } else if (mer === "am" || mer === "a") {
    if (h === 12) h = 0;
  }
  if (h === 24) h = 0;
  if (h > 23) return null;
  return `${pad2(h)}:${pad2(m)}`;
}

function ymdIfValid(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() + 1 !== month ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** DD/MM LatAm o MM/DD US (BirchStreet); si ambas válidas, preferir DMY. */
export function parseFechaNumerica(raw: string): string | null {
  const text = raw.trim();
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    return ymdIfValid(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const slash = text.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (!slash) return null;
  const first = Number(slash[1]);
  const second = Number(slash[2]);
  const yearRaw = slash[3]!;
  const year =
    yearRaw.length === 2
      ? Number(yearRaw) >= 70
        ? 1900 + Number(yearRaw)
        : 2000 + Number(yearRaw)
      : Number(yearRaw);
  const asDmy = ymdIfValid(year, second, first);
  const asMdy = ymdIfValid(year, first, second);
  if (asDmy && !asMdy) return asDmy;
  if (asMdy && !asDmy) return asMdy;
  if (asDmy && asMdy) return asDmy;
  return null;
}

export function parseFechaConMesNombre(frase: string, hoyISO: string): string | null {
  const norm = quitarAcentos(frase);
  const m = norm.match(
    /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(?:de\s+)?(\d{4}))?\b/i,
  );
  if (!m) return null;
  const day = Number(m[1]);
  const mes = MESES[m[2]!.toLowerCase()];
  if (!mes || day < 1 || day > 31) return null;
  const year = m[3] ? Number(m[3]) : Number(hoyISO.slice(0, 4));
  if (!Number.isFinite(year)) return null;
  const iso = `${year}-${pad2(mes)}-${pad2(day)}`;
  const parsed = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return iso;
}
