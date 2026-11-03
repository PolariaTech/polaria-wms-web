import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listarCorreos: vi.fn(),
  ingresarCorreo: vi.fn(),
  consultarIngreso: vi.fn(),
}));
const toast = vi.hoisted(() => ({ showToast: vi.fn() }));

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

import { TAMANO_BLOQUE_CORREOS, TAMANO_PAGINA_CORREOS } from "../types/correos.types";
import { filasDe, lista, usuario } from "../testing/correos.fixtures";
import { CorreosTable } from "./CorreosTable";

describe("CorreosTable — paginación (REQ-104)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

    it("pasa de página sobre lo ya descargado, sin volver al servidor", async () => {
      api.listarCorreos.mockResolvedValue(lista(filasDe(12), 12));
      const user = usuario();
      render(<CorreosTable modo="todos" />);
      await screen.findByText("Correo 1");
      expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
      expect(screen.getByText("Correo 5")).toBeInTheDocument();
      expect(screen.queryByText("Correo 6")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      expect(screen.getByText("Correo 6")).toBeInTheDocument();
      expect(screen.getByText("Correo 10")).toBeInTheDocument();
      expect(screen.queryByText("Correo 1")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      expect(screen.getByText("Correo 11")).toBeInTheDocument();
      expect(screen.getByText("Correo 12")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Página anterior" }));
      expect(screen.getByText("Correo 6")).toBeInTheDocument();

      // un solo viaje al servidor para recorrer las tres páginas
      expect(api.listarCorreos).toHaveBeenCalledTimes(1);
    });

    it("trae el siguiente bloque antes de llegar, así cruzar de bloque no espera", async () => {
      const POR_BLOQUE = TAMANO_BLOQUE_CORREOS / TAMANO_PAGINA_CORREOS;
      api.listarCorreos.mockImplementation(
        ({ pagina }: { pagina: number }) =>
          Promise.resolve(
            lista(
              filasDe(
                Math.min(TAMANO_BLOQUE_CORREOS, 120 - (pagina - 1) * TAMANO_BLOQUE_CORREOS),
                (pagina - 1) * TAMANO_BLOQUE_CORREOS + 1,
              ),
              120,
            ),
          ),
      );
      const user = usuario();
      render(<CorreosTable modo="todos" />);
      await screen.findByText("Correo 1");
      expect(screen.getByText(`Página 1 de ${120 / TAMANO_PAGINA_CORREOS}`)).toBeInTheDocument();
      // primero solo el bloque 1: aún lejos del final
      expect(api.listarCorreos).toHaveBeenCalledTimes(1);

      // se avanza hasta el penúltimo tramo del bloque (el aviso previo)
      for (let clic = 1; clic < POR_BLOQUE - 2; clic += 1) {
        await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      }
      await screen.findByText(`Correo ${(POR_BLOQUE - 3) * TAMANO_PAGINA_CORREOS + 1}`);
      await vi.waitFor(() => expect(api.listarCorreos).toHaveBeenCalledTimes(2));
      expect(api.listarCorreos).toHaveBeenLastCalledWith(
        expect.objectContaining({ pagina: 2, tamano: TAMANO_BLOQUE_CORREOS }),
        expect.any(AbortSignal),
      );

      // al cruzar al bloque 2 las filas aparecen y no se pide nada más
      for (let clic = POR_BLOQUE - 2; clic <= POR_BLOQUE; clic += 1) {
        await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      }
      expect(await screen.findByText("Correo 51")).toBeInTheDocument();
      expect(api.listarCorreos).toHaveBeenCalledTimes(2);
    });

    it("al filtrar vuelve a la primera página y descarta lo guardado", async () => {
      api.listarCorreos.mockResolvedValue(lista(filasDe(12), 12));
      const user = usuario();
      render(<CorreosTable modo="todos" />);
      await screen.findByText("Correo 1");
      await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      expect(screen.getByText("Correo 6")).toBeInTheDocument();

      api.listarCorreos.mockResolvedValue(lista(filasDe(2, 100), 2));
      await user.type(screen.getByLabelText("Buscar asunto…"), "x");
      await act(() => vi.advanceTimersByTimeAsync(400));

      expect(await screen.findByText("Correo 100")).toBeInTheDocument();
      expect(screen.getByText("Mostrando 1–2 de 2")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Página siguiente" })).not.toBeInTheDocument();
      expect(screen.queryByText("Correo 6")).not.toBeInTheDocument();
    });

    it("al actualizar vuelve a pedir los correos y no se queda en una página que ya no existe", async () => {
      api.listarCorreos.mockResolvedValueOnce(lista(filasDe(12), 12));
      const user = usuario();
      render(<CorreosTable modo="todos" />);
      await screen.findByText("Correo 1");
      await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      expect(screen.getByText("Página 3 de 3")).toBeInTheDocument();

      api.listarCorreos.mockResolvedValue(lista(filasDe(6), 6));
      await user.click(screen.getByRole("button", { name: "Actualizar lista de correos" }));

      expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
      expect(screen.getByText("Correo 6")).toBeInTheDocument();
      expect(api.listarCorreos).toHaveBeenCalledTimes(2);
    });
});
