import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { CypherPrefacturaStage } from "./CypherPrefacturaStage";

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ session: { codigoEmpresa: "Y9IHZ" }, context: null }),
  },
}));

vi.mock("../../print-batch/blob-prefactura", () => ({
  blobPrefactura: vi.fn(async () => new Blob(["%PDF"], { type: "application/pdf" })),
}));

const orden = { id_orden_venta: "ov-1", codigo: "OV-9" } as OrdenVentaDetalleRow;

describe("CypherPrefacturaStage", () => {
  it("muestra el 04 y, al abrirlo, el PDF de esa orden", async () => {
    const { blobPrefactura } = await import("../../print-batch/blob-prefactura");
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:prefactura");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    render(
      <CypherPrefacturaStage
        openStages={new Set(["prefactura"])}
        toggleAccordionStage={vi.fn()}
        orden={orden}
      />,
    );

    expect(screen.getByText("04")).toBeInTheDocument();
    expect(screen.getByText("Prefactura")).toBeInTheDocument();
    expect(await screen.findByTitle("Prefactura")).toHaveAttribute("src", "blob:prefactura");
    expect(blobPrefactura).toHaveBeenCalledWith(orden, "Y9IHZ");
  });
});
