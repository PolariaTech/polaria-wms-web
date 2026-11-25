import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmpresaCreateModal } from "./EmpresaCreateModal";

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: { session: { idUsuario: string } | null }) => unknown,
  ) => selector({ session: { idUsuario: "user-1" } }),
}));

vi.mock("../services/empresas.service", () => ({
  createEmpresaConfigurator: vi.fn(),
}));

describe("EmpresaCreateModal", () => {
  it("guarda aunque el RFC tenga 10 caracteres", async () => {
    const user = userEvent.setup();
    const { createEmpresaConfigurator } = await import(
      "../services/empresas.service"
    );

    render(
      <EmpresaCreateModal open onClose={vi.fn()} onCreated={vi.fn()} />,
    );

    await user.type(screen.getByLabelText("RFC"), "APU2103256");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    expect(createEmpresaConfigurator).toHaveBeenCalled();
  });

  it("rechaza un GIF al elegirlo y no lo guarda", async () => {
    const { createEmpresaConfigurator } = await import(
      "../services/empresas.service"
    );
    vi.mocked(createEmpresaConfigurator).mockClear();

    render(
      <EmpresaCreateModal open onClose={vi.fn()} onCreated={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("Logo"), {
      target: { files: [new File(["gif"], "logo.gif", { type: "image/gif" })] },
    });

    expect(screen.getByText("El logo debe ser JPEG o PNG.")).toBeInTheDocument();
    expect(screen.getByText("Sin logo")).toBeInTheDocument();
    expect(createEmpresaConfigurator).not.toHaveBeenCalled();
  });
});
