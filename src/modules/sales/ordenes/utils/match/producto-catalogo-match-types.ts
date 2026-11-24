import type { ProductoVentaOption } from "../../../shared/types/sales.types";

export interface ProductoCatalogoScored {
  producto: ProductoVentaOption;
  score: number;
}

export interface ProductoCatalogoMatchResult {
  /** Mejor candidato por encima del umbral mínimo, o null. */
  best: ProductoVentaOption | null;
  /** Hasta 3 candidatos ordenados (mejor primero). */
  candidates: ProductoCatalogoScored[];
  /**
   * Hay 2+ productos con score parecido: no conviene auto-asignar;
   * el usuario debe elegir entre alternativas.
   */
  ambiguous: boolean;
}

export const MIN_SUGGESTION_SCORE = 0.22;
/** Gap mínimo entre 1.º y 2.º para considerar el match inequívoco. */
export const AMBIGUITY_GAP = 0.1;
export const MAX_CANDIDATES = 3;
/** Máx. candidatos al expandir familia cuando el match es parcial/empatado. */
export const MAX_FAMILY_CANDIDATES = 8;