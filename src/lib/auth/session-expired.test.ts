import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifySessionExpired } from "@/lib/auth/session-expired";
import { useSessionExpiredStore } from "@/stores/session-expired.store";

const mateo = vi.hoisted(() => ({ enCurso: false }));

vi.mock("@/lib/auth/mateo-sso-exit", () => ({
  isMateoSsoExitInProgress: () => mateo.enCurso,
}));

describe("notifySessionExpired", () => {
  beforeEach(() => {
    mateo.enCurso = false;
    useSessionExpiredStore.setState({ isOpen: false });
  });

  it("abre el modal cuando un endpoint autenticado rechaza el token", () => {
    notifySessionExpired("/auth/me");

    expect(useSessionExpiredStore.getState().isOpen).toBe(true);
  });

  it("no abre el modal en el cambio de contraseña: ahí 401 es clave actual incorrecta", () => {
    notifySessionExpired("/auth/me/password");

    expect(useSessionExpiredStore.getState().isOpen).toBe(false);
  });

  it("ignora la query string al decidir si la ruta está excluida", () => {
    notifySessionExpired("/auth/me/password?x=1");

    expect(useSessionExpiredStore.getState().isOpen).toBe(false);
  });

  it("no abre el modal mientras se sale hacia Mateo", () => {
    mateo.enCurso = true;

    notifySessionExpired("/auth/me");

    expect(useSessionExpiredStore.getState().isOpen).toBe(false);
  });
});
