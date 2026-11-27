import { beforeEach, describe, expect, it } from "vitest";
import { useSessionExpiredStore } from "@/stores/session-expired.store";

describe("useSessionExpiredStore", () => {
  beforeEach(() => {
    useSessionExpiredStore.setState({ isOpen: false });
  });

  it("empieza cerrado", () => {
    expect(useSessionExpiredStore.getState().isOpen).toBe(false);
  });

  it("open abre el modal y close lo cierra", () => {
    useSessionExpiredStore.getState().open();
    expect(useSessionExpiredStore.getState().isOpen).toBe(true);

    useSessionExpiredStore.getState().close();
    expect(useSessionExpiredStore.getState().isOpen).toBe(false);
  });

  it("abrir varias veces seguidas deja un solo modal abierto", () => {
    useSessionExpiredStore.getState().open();
    useSessionExpiredStore.getState().open();

    expect(useSessionExpiredStore.getState().isOpen).toBe(true);
  });
});
