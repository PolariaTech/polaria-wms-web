/**
 * Análisis de fortaleza de contraseña (requisitos de creación de usuario).
 */

export type PasswordCheckId =
  | "length"
  | "upper"
  | "lower"
  | "number"
  | "special"
  | "common";

export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordAnalysis {
  checks: Record<PasswordCheckId, boolean>;
  score: PasswordStrengthScore;
  label: string;
  isValid: boolean;
  errors: string[];
}

const SPECIAL_RE = /[!@#$%^&*()_\-+=[\]{};:,.?/]/;
const COMMON_PASSWORDS = new Set(
  [
    "12345678",
    "123456789",
    "1234567890",
    "password",
    "password1",
    "password123",
    "qwerty",
    "qwerty123",
    "admin123",
    "admin1234",
    "welcome1",
    "abc12345",
    "iloveyou",
    "11111111",
    "00000000",
    "asdfghjk",
    "letmein1",
    "monkey12",
    "dragon12",
    "contraseña",
    "contrasena",
    "clave123",
    "polaria1",
  ].map((p) => p.toLowerCase()),
);

export const PASSWORD_CHECK_LABELS: Record<PasswordCheckId, string> = {
  length: "Mínimo 8 caracteres (ideal 12+)",
  upper: "Al menos 1 mayúscula (A-Z)",
  lower: "Al menos 1 minúscula (a-z)",
  number: "Al menos 1 número (0-9)",
  special: "Al menos 1 carácter especial",
  common: "No es una contraseña común",
};

const STRENGTH_LABELS: Record<PasswordStrengthScore, string> = {
  0: "Muy débil",
  1: "Débil",
  2: "Aceptable",
  3: "Fuerte",
  4: "Muy fuerte",
};

/** Normaliza: sin espacios al inicio/final. */
export function normalizePasswordInput(value: string): string {
  return value.replace(/^\s+/, "").replace(/\s+$/, "");
}

export function analyzePassword(raw: string): PasswordAnalysis {
  const value = normalizePasswordInput(raw);
  const checks: Record<PasswordCheckId, boolean> = {
    length: value.length >= 8,
    upper: /[A-ZÁÉÍÓÚÑ]/.test(value),
    lower: /[a-záéíóúñ]/.test(value),
    number: /\d/.test(value),
    special: SPECIAL_RE.test(value),
    common: value.length > 0 && !COMMON_PASSWORDS.has(value.toLowerCase()),
  };

  const errors: string[] = [];
  if (value.length === 0) {
    errors.push("La contraseña es obligatoria.");
  } else {
    if (!checks.length) errors.push("Debe tener al menos 8 caracteres.");
    if (!checks.upper) errors.push("Debe incluir al menos una mayúscula.");
    if (!checks.lower) errors.push("Debe incluir al menos una minúscula.");
    if (!checks.number) errors.push("Debe incluir al menos un número.");
    if (!checks.special) {
      errors.push("Debe incluir al menos un carácter especial.");
    }
    if (!checks.common) errors.push("Esa contraseña es demasiado común.");
  }

  const requirementCount = [
    checks.length,
    checks.upper,
    checks.lower,
    checks.number,
    checks.special,
  ].filter(Boolean).length;

  let score: PasswordStrengthScore = 0;
  if (value.length === 0) {
    score = 0;
  } else if (!checks.common || requirementCount <= 2) {
    score = 1;
  } else if (requirementCount <= 4) {
    score = 2;
  } else if (value.length < 12) {
    score = 3;
  } else {
    score = 4;
  }

  const isValid = Object.values(checks).every(Boolean);

  return {
    checks,
    score,
    label: STRENGTH_LABELS[score],
    isValid,
    errors,
  };
}
