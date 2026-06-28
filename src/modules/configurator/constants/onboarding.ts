export const ONBOARDING_PAGE_TITLE = "Onboarding nuevo tenant" as const;

export const ONBOARDING_PAGE_SUBTITLE =
  "Configura empresa, cuenta comercial, bodega interna y administrador en un solo flujo." as const;

export const ONBOARDING_STEPS = [
  { id: "empresa", label: "Empresa" },
  { id: "cuenta", label: "Cuenta" },
  { id: "bodega", label: "Bodega" },
  { id: "admin", label: "Admin cuenta" },
] as const;

export const ONBOARDING_SUMMARY_TITLE = "Tenant configurado" as const;

export const ONBOARDING_SUMMARY_SUBTITLE =
  "El onboarding se completó correctamente. Resumen de lo creado:" as const;
