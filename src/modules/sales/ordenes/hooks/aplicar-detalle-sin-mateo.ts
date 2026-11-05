import type { CompradorListRow } from "@/modules/admin-panel";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import { resolvePropuestaClienteMateoAlReabrir } from "../utils/pedido/resolve-cabecera-guardada";
import { mergeLineasBdConOrigenPendiente } from "../utils/pedido/merge-lineas-bd-y-origen";
import {
  rankCompradoresFromNombre,
} from "../utils/match/match-comprador-from-nombre";

/** Carga detalle OV sin remapeo Mateo (no externa por_confirmar). */
export function aplicarDetalleSinMateo(input: {
  ovMaterializada: boolean;
  lineasDesdeDetalle: () => LineaVentaForm[];
  hijasEdit: OrdenTrabajoHija[];
  idCompradorDetalle: string;
  nombreEscritoOrigen: string | null;
  compradorRows: CompradorListRow[];
  skipOtSeedFromOrigenRef: { current: boolean };
  setLineas: (value: LineaVentaForm[]) => void;
  setStartMode: (value: "docs") => void;
  setFormOtPage: (value: number) => void;
  setStep: (value: "form") => void;
  setCompradorNombreIa: (value: string | null) => void;
  setCompradorLabel: (value: string) => void;
  setCompradorSugerencias: (value: CompradorListRow[]) => void;
  setMissingFields: (
    value: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  origenCorreoRows?: OrigenCorreoRenglon[];
  productoRows?: ProductoVentaOption[];
}) {
  const {
    ovMaterializada,
    lineasDesdeDetalle,
    hijasEdit,
    idCompradorDetalle,
    nombreEscritoOrigen,
    compradorRows,
    skipOtSeedFromOrigenRef,
    setLineas,
    setStartMode,
    setFormOtPage,
    setStep,
    setCompradorNombreIa,
    setCompradorLabel,
    setCompradorSugerencias,
    setMissingFields,
    origenCorreoRows,
    productoRows,
  } = input;
  skipOtSeedFromOrigenRef.current = ovMaterializada;
  if (ovMaterializada && (origenCorreoRows?.length ?? 0) > 0) {
    setLineas(
      mergeLineasBdConOrigenPendiente({
        lineasBd: lineasDesdeDetalle(),
        hijas: hijasEdit,
        origenRows: origenCorreoRows ?? [],
        productos: productoRows ?? [],
      }),
    );
  } else {
    setLineas(lineasDesdeDetalle());
  }
  if (hijasEdit.length > 0) {
    setStartMode("docs");
    setFormOtPage(0);
    setStep("form");
  }
  const propuestaMateo = resolvePropuestaClienteMateoAlReabrir({
    idComprador: idCompradorDetalle,
    nombreEnOrigen: nombreEscritoOrigen,
  });
  if (!propuestaMateo) return;
  setCompradorNombreIa(propuestaMateo);
  setCompradorLabel(propuestaMateo);
  const compradorRank = rankCompradoresFromNombre(
    propuestaMateo,
    compradorRows,
  );
  setCompradorSugerencias(
    compradorRank.candidates.map((c) => c.comprador).slice(0, 4),
  );
  setMissingFields((prev) => {
    const next = new Set(prev);
    next.add("cliente");
    return next;
  });
}
