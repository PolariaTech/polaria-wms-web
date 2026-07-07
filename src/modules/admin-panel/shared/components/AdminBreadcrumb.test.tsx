import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { AdminBreadcrumb } from "./AdminBreadcrumb";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("AdminBreadcrumb", () => {
  it("muestra ruta en reportes del administrador de cuenta", () => {
    vi.mocked(usePathname).mockReturnValue(ROUTES.dashboardReporteria);

    render(<AdminBreadcrumb />);

    expect(
      screen.getByRole("navigation", { name: "Ruta del panel administrativo" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute(
      "href",
      ROUTES.dashboard,
    );
    expect(screen.getByText("Reportes")).toBeInTheDocument();
  });

  it("muestra ruta en catálogo", () => {
    vi.mocked(usePathname).mockReturnValue(ROUTES.dashboardCatalog);

    render(<AdminBreadcrumb />);

    expect(screen.getByRole("link", { name: "Inicio" })).toBeInTheDocument();
    expect(screen.getByText("Catálogo")).toBeInTheDocument();
  });
});
