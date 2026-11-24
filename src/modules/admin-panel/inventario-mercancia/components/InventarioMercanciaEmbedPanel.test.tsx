import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InventarioMercanciaEmbedPanel } from "./InventarioMercanciaEmbedPanel";

const reports = [
  { id: "r1", descripcion: "Stock", reporteId: "x" },
  { id: "r2", descripcion: "Movimientos", reporteId: "y" },
];

function renderPanel(
  overrides: Partial<Parameters<typeof InventarioMercanciaEmbedPanel>[0]> = {},
) {
  const onSelectReport = vi.fn();
  render(
    <InventarioMercanciaEmbedPanel
      embedReports={[]}
      selectedEmbedReportId={null}
      embedViewUrl={null}
      embedLoading={false}
      embedError={null}
      onSelectReport={onSelectReport}
      {...overrides}
    />,
  );
  return { onSelectReport };
}

describe("InventarioMercanciaEmbedPanel", () => {
  it("pide elegir un reporte cuando hay varios sin selección", () => {
    renderPanel({ embedReports: reports as never });
    expect(screen.getByText("Elige un reporte para visualizarlo.")).toBeInTheDocument();
  });

  it("notifica el reporte seleccionado", async () => {
    const user = userEvent.setup();
    const { onSelectReport } = renderPanel({ embedReports: reports as never });
    await user.click(screen.getByRole("button", { name: "Movimientos" }));
    expect(onSelectReport).toHaveBeenCalledWith("r2");
  });

  it("muestra el error", () => {
    renderPanel({ embedError: "Falló" });
    expect(screen.getByRole("alert")).toHaveTextContent("Falló");
  });

  it("renderiza el iframe cuando hay URL", () => {
    renderPanel({
      embedReports: [reports[0]] as never,
      selectedEmbedReportId: "r1",
      embedViewUrl: "https://example.com/view",
    });
    expect(screen.getByTitle("Stock")).toHaveAttribute(
      "src",
      "https://example.com/view",
    );
  });
});
