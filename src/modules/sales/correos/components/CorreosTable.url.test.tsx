import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listarCorreos: vi.fn(),
  ingresarCorreo: vi.fn(),
  consultarIngreso: vi.fn(),
}));
const toast = vi.hoisted(() => ({ showToast: vi.fn() }));
const navegacion = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
}));

vi.mock("@/config/env", () => ({ getApiBaseUrl: () => "/api" }));
vi.mock("@/lib/utils/tenant-headers", () => ({ applyTenantHeaders: vi.fn() }));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ accessToken: "t" }) },
}));
vi.mock("@/components/shared/toast/PolariaToastProvider", () => ({
  usePolariaToast: () => toast,
}));
vi.mock("../services/correos.client", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("../services/correos.client")>()),
  ...api,
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => navegacion.params,
  usePathname: () => "/dashboard/ventas/correos-descartados",
  useRouter: () => ({ replace: navegacion.replace }),
}));

import { TAMANO_PAGINA_CORREOS } from "../types/correos.types";
import { filasDe, lista, usuario } from "../testing/correos.fixtures";
import { CorreosTable } from "./CorreosTable";

describe("CorreosTable — URL (REQ-318)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    sessionStorage.clear();
    navegacion.params = new URLSearchParams();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("abre en la página y filtros de la URL", async () => {
    navegacion.params = new URLSearchParams("pagina=2&remitente=hotel");
    api.listarCorreos.mockResolvedValue(lista(filasDe(12), 12));

    render(<CorreosTable modo="descartados" />);
    await screen.findByText("Correo 6");

    expect(api.listarCorreos.mock.calls[0][0].filtros.remitente).toBe("hotel");
    expect(screen.getByText("Correo 6")).toBeInTheDocument();
    expect(screen.getByText("Correo 10")).toBeInTheDocument();
    expect(screen.queryByText("Correo 5")).not.toBeInTheDocument();
    expect(screen.queryByText("Correo 11")).not.toBeInTheDocument();
    expect(TAMANO_PAGINA_CORREOS).toBe(5);
  });

  it("al ir a la página 3 escribe la URL sin recargar", async () => {
    navegacion.params = new URLSearchParams("pagina=2&remitente=hotel");
    api.listarCorreos.mockResolvedValue(lista(filasDe(12), 12));
    const user = usuario();

    render(<CorreosTable modo="descartados" />);
    await screen.findByText("Correo 6");
    await user.click(screen.getByRole("button", { name: "Página siguiente" }));

    expect(navegacion.replace).toHaveBeenCalledWith(
      "/dashboard/ventas/correos-descartados?pagina=3&remitente=hotel",
      { scroll: false },
    );
  });

  it("limpiar filtros deja la URL sin query tras el retardo", async () => {
    navegacion.params = new URLSearchParams("pagina=2&remitente=hotel");
    api.listarCorreos.mockResolvedValue(lista(filasDe(12), 12));
    const user = usuario();

    render(<CorreosTable modo="descartados" />);
    await screen.findByText("Correo 6");
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(navegacion.replace).toHaveBeenCalledWith(
      "/dashboard/ventas/correos-descartados",
      { scroll: false },
    );
  });

  it("pide el modo procesados", async () => {
    api.listarCorreos.mockResolvedValue(lista([], 0));
    render(<CorreosTable modo="procesados" />);
    await screen.findByText(/Todavía no hay correos procesados|Ningún correo/);

    expect(api.listarCorreos.mock.calls[0][0].modo).toBe("procesados");
  });

  it("marca Último abierto y lo mueve al abrir otra fila", async () => {
    api.listarCorreos.mockResolvedValue(lista(filasDe(12), 12));
    sessionStorage.setItem("polaria.ventas.correos.ultimoAbierto", "msg-2");
    const user = usuario();

    render(<CorreosTable modo="descartados" />);
    await screen.findByText("Correo 2");

    const fila2 = screen.getByText("Correo 2").closest("tr");
    expect(fila2).toHaveAttribute("aria-current", "true");
    expect(fila2).toHaveTextContent("Último abierto");
    expect(screen.getAllByText("Último abierto")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Correo 3" }));
    const fila3 = screen.getByRole("button", { name: "Correo 3" }).closest("tr");
    expect(fila3).toHaveAttribute("aria-current", "true");
    expect(fila2).not.toHaveAttribute("aria-current");
    expect(sessionStorage.getItem("polaria.ventas.correos.ultimoAbierto")).toBe(
      "msg-3",
    );
  });

  it("si sessionStorage falla, la tabla se pinta sin marca", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    api.listarCorreos.mockResolvedValue(lista(filasDe(12), 12));

    render(<CorreosTable modo="descartados" />);
    await screen.findByText("Correo 1");

    expect(screen.queryByText("Último abierto")).not.toBeInTheDocument();
    expect(screen.queryByRole("row", { current: true })).not.toBeInTheDocument();
  });
});
