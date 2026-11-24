import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import {
  calcUnidadesPorKgPrimario,
  parseGramosPorUnidadInput,
  parseMermaPctInput,
} from "../constants/catalogo-conversion";
import type { ProductoSecundarioForm } from "./producto-secundario-create-modal.types";

export type ProductoSecundarioValidation =
  | { ok: false; error: string }
  | {
      ok: true;
      titulo: string;
      sku: string;
      gramos: number;
      mermaPct: number;
      unidadesPorKg: number;
    };

/** Valida el formulario de secundario en el mismo orden que el submit original. */
export function validateProductoSecundarioForm(
  form: ProductoSecundarioForm,
): ProductoSecundarioValidation {
  const titulo = form.titulo.trim();
  if (!titulo) return { ok: false, error: "El título es obligatorio." };
  if (!form.descripcion?.trim()) {
    return { ok: false, error: "La descripción es obligatoria." };
  }
  if (!form.proveedor?.trim()) {
    return { ok: false, error: "El proveedor es obligatorio." };
  }
  if (!form.categoria?.trim()) {
    return { ok: false, error: "La categoría es obligatoria." };
  }
  if (!form.estado?.trim()) {
    return { ok: false, error: "El estado es obligatorio." };
  }
  if (!form.unidadMedida?.trim()) {
    return { ok: false, error: "La unidad es obligatoria." };
  }
  if (!form.idProductoPrimario) {
    return { ok: false, error: "Selecciona el producto primario incluido." };
  }

  const gramos = parseGramosPorUnidadInput(form.gramosPorUnidad ?? "");
  if (gramos === null) {
    return {
      ok: false,
      error: "Los gramos por unidad deben ser mayores a cero.",
    };
  }

  const mermaPct = parseMermaPctInput(form.mermaPct ?? "0");
  if (mermaPct === null) {
    return { ok: false, error: "El % de merma debe estar entre 0 y 100." };
  }

  const unidadesPorKg = calcUnidadesPorKgPrimario(gramos);
  if (unidadesPorKg === null) {
    return {
      ok: false,
      error: "No se pudo calcular la relación de conversión.",
    };
  }

  const sku = generateCodigoCuentaFromNombre(titulo);
  if (!sku) {
    return {
      ok: false,
      error: "No se pudo generar el SKU del producto secundario.",
    };
  }

  return { ok: true, titulo, sku, gramos, mermaPct, unidadesPorKg };
}
