import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listarCorreos: vi.fn(),
  ingresarCorreo: vi.fn(),
  consultarIngreso: vi.fn(),
}));

vi.mock("@/config/env", () => ({ getApiBaseUrl: () => "/api" }));
vi.mock("@/lib/utils/tenant-headers", () => ({ applyTenantHeaders: vi.fn() }));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ accessToken: "t" }) },
}));
vi.mock("@/components/shared/toast/PolariaToastProvider", () => ({
  usePolariaToast: () => ({ showToast: vi.fn() }),
}));
vi.mock("../services/correos.client", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("../services/correos.client")>()),
  ...api,
}));

import { BOTON_INGRESAR, fila, lista, usuario } from "../testing/correos.fixtures";
import { CorreosTable } from "./CorreosTable";

const base = { nuevoPedido: null, motivo: null } as const;

describe("CorreosTable — estado de cada correo (REQ-275)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });

  it("dice en qué OV quedó un correo que el flujo ingresó, y muestra las demás", async () => {
    api.listarCorreos.mockResolvedValue(
      lista([
        fila({
          ...base,
          resultado: "ingresado",
          codigoOrdenVenta: "OV-00001132, OV-00001133",
        }),
      ]),
    );
    render(<CorreosTable modo="todos" />);

    expect(await screen.findByText("OV-00001132")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText(/y también OV-00001133/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: BOTON_INGRESAR })).not.toBeInTheDocument();
  });

  it("un duplicado avisa y deja ingresarlo a mano", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila({ ...base, resultado: "duplicado" })]));
    render(<CorreosTable modo="todos" />);

    expect(await screen.findByText("Ya había una orden con ese número")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BOTON_INGRESAR })).toBeInTheDocument();
  });

  it("un error del flujo avisa y deja ingresarlo a mano", async () => {
    api.listarCorreos.mockResolvedValue(lista([fila({ ...base, resultado: "error" })]));
    render(<CorreosTable modo="todos" />);

    expect(await screen.findByText("El flujo no pudo ingresarlo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BOTON_INGRESAR })).toBeInTheDocument();
  });

  it("un correo recibido hace rato sin avanzar queda «Sin procesar» con botón", async () => {
    api.listarCorreos.mockResolvedValue(
      lista([fila({ ...base, resultado: "recibido", registradoEn: "2020-01-01T00:00:00.000Z" })]),
    );
    render(<CorreosTable modo="todos" />);

    expect(await screen.findByText("Sin procesar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BOTON_INGRESAR })).toBeInTheDocument();
  });

  it("un descartado de confianza media se marca «Revisar»", async () => {
    api.listarCorreos.mockResolvedValue(
      lista([fila({ nuevoPedido: false, resultado: "no_es_pedido", confianza: "media" })]),
    );
    render(<CorreosTable modo="todos" />);

    expect(await screen.findByText("Revisar: Cotización, no es pedido")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BOTON_INGRESAR })).toBeInTheDocument();
  });

  it("el modal repite el estado y la seguridad del clasificador, sin términos técnicos", async () => {
    api.listarCorreos.mockResolvedValue(
      lista([fila({ ...base, resultado: "duplicado", confianza: "baja" })]),
    );
    const user = usuario();
    render(<CorreosTable modo="todos" />);

    await user.click(await screen.findByText("compras@hotel.com"));

    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getAllByText("Ya había una orden con ese número").length).toBeGreaterThan(0);
    expect(within(dialogo).getByText("Seguridad del clasificador: baja")).toBeInTheDocument();
    expect(within(dialogo).queryByText(/duplicado|no_es_pedido|recibido/)).not.toBeInTheDocument();
  });
});
