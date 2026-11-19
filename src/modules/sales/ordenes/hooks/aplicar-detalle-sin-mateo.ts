import type { CompradorListRow } from "@/modules/admin-panel";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import { resolvePropuestaClienteMateoAlReabrir } from "../utils/pedido/resolve-cabecera-guardada";
import { mergeLineasBdConOrigenPendiente } from "../utils/pedido/merge-lineas-bd-y-origen";
import { sugerenciasCompradorParaPicker } from "../utils/match/match-comprador-from-nombre";

function limpioCliente(value: string | null | undefined): string {
  const t = (value ?? "").trim();
  return t && t !== "—" ? t : "";
}

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
  // REQ-326: el nombre de Mateo vive en origen aunque la OV ya tenga id_comprador.
  // Sin esto el picker no rankea en cuentas donde el cliente ya venía matcheado.
  const nombreMateo = limpioCliente(nombreEscritoOrigen);
  if (nombreMateo) {
    setCompradorNombreIa(nombreMateo);
    setCompradorSugerencias(
      sugerenciasCompradorParaPicker(nombreMateo, compradorRows),
    );
  }

  const propuestaMateo = resolvePropuestaClienteMateoAlReabrir({
    idComprador: idCompradorDetalle,
    nombreEnOrigen: nombreEscritoOrigen,
  });
  if (!propuestaMateo) return;
  setCompradorLabel(propuestaMateo);
  setMissingFields((prev) => {
    const next = new Set(prev);
    next.add("cliente");
    return next;
  });
}
