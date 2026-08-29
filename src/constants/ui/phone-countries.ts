import {
  parsePhoneNumberFromString,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";

export const DEFAULT_PHONE_COUNTRY_CODE = "CO" as const;

/** Países frecuentes en operación LATAM + España y EE.UU. */
export const PHONE_INPUT_COUNTRIES = [
  "CO",
  "MX",
  "AR",
  "CL",
  "PE",
  "EC",
  "VE",
  "BO",
  "PY",
  "UY",
  "CR",
  "PA",
  "GT",
  "HN",
  "SV",
  "NI",
  "DO",
  "US",
  "ES",
  "BR",
] as const;

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/**
 * Interpreta teléfonos guardados en distintos formatos:
 * E.164 (`+57…`), dígitos con país sin `+` (`57…`) o nacional CO (`300…`).
 */
export function parseStoredPhone(
  value: string | null | undefined,
): PhoneNumber | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "—") return undefined;

  if (trimmed.startsWith("+")) {
    const international = parsePhoneNumberFromString(trimmed);
    return international?.isValid() ? international : undefined;
  }

  const national = parsePhoneNumberFromString(
    trimmed,
    DEFAULT_PHONE_COUNTRY_CODE as CountryCode,
  );
  if (national?.isValid()) return national;

  const withPlus = parsePhoneNumberFromString(`+${digitsOnly(trimmed)}`);
  return withPlus?.isValid() ? withPlus : undefined;
}

export function formatInternationalPhoneDisplay(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "—") return "—";

  const parsed = parseStoredPhone(trimmed);
  return parsed ? parsed.formatInternational() : trimmed;
}

export function isValidInternationalPhone(value: string): boolean {
  return Boolean(parseStoredPhone(value)?.isValid());
}

export function normalizeInternationalPhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  return parseStoredPhone(trimmed)?.number ?? trimmed;
}
