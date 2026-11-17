import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listarCorreos: vi.fn(),
  ingresarCorreo: vi.fn(),
  consultarIngreso: vi.fn(),
}));
const toast = vi.hoisted(() => ({ showToast: vi.fn() }));
const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

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
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/dashboard/ventas/correos-descartados",
  useRouter: () => nav,
}));

import { BOTON_INGRESAR, fila, ingreso, lista, usuario } from "../testing/correos.fixtures";
import { CorreosTable } from "./CorreosTable";

describe("CorreosTable — detalle del correo (REQ-317)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("al hacer clic en una fila navega al correo completo, sin diálogo", async () => {
    api.listarCorreos.mockResolvedValue(
      lista([
        fila({ messageId: "msg-detalle-1", de: "uno@hotel.com" }),
        fila({ messageId: "msg-detalle-2", de: "dos@hotel.com" }),
      ]),
    );
    const user = usuario();
    render(<CorreosTable modo="descartados" />);

    await user.click(await screen.findByText("uno@hotel.com"));

    expect(nav.push).toHaveBeenCalledWith("/dashboard/ventas/correo/msg-detalle-1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem("polaria.ventas.correos.recorrido") ?? "")).toEqual({
      modo: "descartados",
      ids: ["msg-detalle-1", "msg-detalle-2"],
    });
  });

  it("el asunto desde el teclado también navega", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila({ messageId: "msg-detalle-1" })]));
    const user = usuario();
    render(<CorreosTable modo="descartados" />);

    const asunto = await screen.findByRole("button", { name: "Pedido XEL" });
    asunto.focus();
    await user.keyboard("{Enter}");

    expect(nav.push).toHaveBeenCalledWith("/dashboard/ventas/correo/msg-detalle-1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("el botón de ingreso de la fila no navega", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila({ messageId: "msg-detalle-1" })]));
    api.ingresarCorreo.mockResolvedValue(ingreso({ messageId: "msg-detalle-1" }));
    const user = usuario();
    render(<CorreosTable modo="descartados" />);

    await user.click(await screen.findByRole("button", { name: BOTON_INGRESAR }));

    expect(api.ingresarCorreo).toHaveBeenCalledWith("msg-detalle-1");
    expect(nav.push).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
