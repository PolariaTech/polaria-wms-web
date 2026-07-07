import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";

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

export function formatInternationalPhoneDisplay(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim();
  if (!trimmed) return "—";

  const parsed = parsePhoneNumberFromString(trimmed);
  return parsed?.isValid() ? parsed.formatInternational() : trimmed;
}

export function isValidInternationalPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  return isValidPhoneNumber(trimmed);
}

export function normalizeInternationalPhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const parsed = parsePhoneNumberFromString(trimmed);
  return parsed?.number ?? trimmed;
}
