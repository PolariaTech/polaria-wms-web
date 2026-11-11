import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";

const estado = vi.hoisted(() => ({
  idRol: null as string | null,
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: estado.replace }),
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (s: { session: { idRol: string } | null }) => unknown,
  ) => selector({ session: estado.idRol ? { idRol: estado.idRol } : null }),
}));
vi.mock("@/modules/sales/ordenes/despacho/CodigoDespachoPageContent", () => ({
  CodigoDespachoPageContent: () => <div>Pantalla del código de despacho</div>,
}));

import DashboardVentasCodigoDespachoPage from "./page";

describe("página del código de despacho (REQ-306)", () => {
  beforeEach(() => {
    estado.replace.mockReset();
  });

  it.each(["administrador_cuenta", "operador_cuenta"])(
    "deja entrar al rol %s",
    (idRol) => {
      estado.idRol = idRol;
      render(<DashboardVentasCodigoDespachoPage />);

      expect(screen.getByText("Pantalla del código de despacho")).toBeInTheDocument();
      expect(estado.replace).not.toHaveBeenCalled();
    },
  );

  it.each(["configurador", "administrador_bodega", "jefe_bodega", "operario", "transportista"])(
    "redirige al inicio al rol %s y no muestra la pantalla",
    (idRol) => {
      estado.idRol = idRol;
      render(<DashboardVentasCodigoDespachoPage />);

      expect(screen.queryByText("Pantalla del código de despacho")).not.toBeInTheDocument();
      expect(estado.replace).toHaveBeenCalledWith(ROUTES.dashboard);
    },
  );

  it("sin sesión no muestra nada ni redirige (la sesión aún se está cargando)", () => {
    estado.idRol = null;
    render(<DashboardVentasCodigoDespachoPage />);

    expect(screen.queryByText("Pantalla del código de despacho")).not.toBeInTheDocument();
    expect(estado.replace).not.toHaveBeenCalled();
  });
});
