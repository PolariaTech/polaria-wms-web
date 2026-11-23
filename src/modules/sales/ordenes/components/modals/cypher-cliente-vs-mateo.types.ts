import type { CompradorListRow } from "@/modules/admin-panel/compradores/services/compradores.service";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import type { MateoCoincidenciaKind } from "../../utils/match/mateo-coincidencia";

export type CompareRow = {
  campo: string;
  correo: string;
  mateo: string;
  usuario: string;
  coincidencia: MateoCoincidenciaKind;
  group?: string;
};

export type MateoSuggestContext = {
  productos: readonly ProductoVentaOption[];
  compradores: readonly CompradorListRow[];
};