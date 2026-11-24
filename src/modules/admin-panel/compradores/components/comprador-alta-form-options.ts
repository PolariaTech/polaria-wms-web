export const REGIMEN_OPTIONS = [
  { value: "", label: "—" },
  { value: "601 — General de ley personas morales", label: "601 — General de ley personas morales" },
  { value: "612 — Personas físicas con actividad empresarial", label: "612 — Personas físicas con actividad empresarial" },
  { value: "626 — RESICO", label: "626 — RESICO" },
  { value: "616 — Sin obligaciones fiscales", label: "616 — Sin obligaciones fiscales" },
];

export const USO_CFDI_OPTIONS = [
  { value: "G01 — Adquisición de mercancías", label: "G01 — Adquisición de mercancías" },
  { value: "G03 — Gastos en general", label: "G03 — Gastos en general" },
  { value: "S01 — Sin efectos fiscales", label: "S01 — Sin efectos fiscales" },
];

export const ESTADO_OPTIONS = [
  { value: "Activo", label: "Activo" },
  { value: "Suspendido por cartera", label: "Suspendido por cartera" },
  { value: "Prospecto", label: "Prospecto" },
];

export const METODO_PAGO_OPTIONS = [
  { value: "PPD — Parcialidades o diferido", label: "PPD — Parcialidades o diferido" },
  { value: "PUE — Una sola exhibición", label: "PUE — Una sola exhibición" },
];

export const FORMA_PAGO_OPTIONS = [
  { value: "03 — Transferencia electrónica", label: "03 — Transferencia electrónica" },
  { value: "01 — Efectivo", label: "01 — Efectivo" },
  { value: "99 — Por definir", label: "99 — Por definir" },
];

export const SI_NO_OPTIONS = [
  { value: "Sí", label: "Sí" },
  { value: "No", label: "No" },
];

export const SUSTITUCIONES_OPTIONS = [
  { value: "No — surtir parcial", label: "No — surtir parcial" },
  { value: "Sí, avisando antes", label: "Sí, avisando antes" },
  { value: "Sí, a criterio de almacén", label: "Sí, a criterio de almacén" },
];

export const TOLERANCIA_OPTIONS = [
  { value: "", label: "Sin definir" },
  { value: "± 2%", label: "± 2%" },
  { value: "± 5%", label: "± 5%" },
  { value: "± 10%", label: "± 10%" },
];

export const FORMATO_PEDIDO_OPTIONS = [
  { value: "Texto libre", label: "Texto libre" },
  { value: "Orden de compra en PDF", label: "Orden de compra en PDF" },
  { value: "Excel", label: "Excel" },
  { value: "Mezclado", label: "Mezclado" },
];

export const ROL_CONTACTO_OPTIONS = [
  { value: "Hace pedidos", label: "Hace pedidos" },
  { value: "Recibe mercancía", label: "Recibe mercancía" },
  { value: "Autoriza", label: "Autoriza" },
  { value: "Paga", label: "Paga" },
];

export const CARRETERA_OPTIONS = [
  { value: "No — entrega urbana local", label: "No — entrega urbana local" },
  { value: "Sí — más de 30 km en tramo federal", label: "Sí — más de 30 km en tramo federal" },
];
