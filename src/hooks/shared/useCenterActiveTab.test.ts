import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCenterActiveTab } from "./useCenterActiveTab";

function setMeasure(el: HTMLElement, key: string, value: number) {
  Object.defineProperty(el, key, { configurable: true, value });
}

function buildNav(withActive: boolean) {
  const nav = document.createElement("nav");
  const tab = document.createElement("button");
  if (withActive) tab.setAttribute("aria-current", "true");
  nav.appendChild(tab);
  setMeasure(nav, "clientWidth", 300);
  setMeasure(tab, "offsetLeft", 500);
  setMeasure(tab, "offsetWidth", 100);
  const scrollTo = vi.fn();
  nav.scrollTo = scrollTo as unknown as typeof nav.scrollTo;
  return { nav, tab, scrollTo };
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion"),
      media: query,
    })),
  );
}

describe("useCenterActiveTab (REQ-209)", () => {
  beforeEach(() => {
    stubReducedMotion(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("centra la pestaña activa con scroll suave", () => {
    const { nav, scrollTo } = buildNav(true);
    renderHook(() => useCenterActiveTab({ current: nav }, "correo"));

    // 500 - (300 - 100) / 2 = 400
    expect(scrollTo).toHaveBeenCalledWith({ left: 400, behavior: "smooth" });
  });

  it("no usa animación si el sistema pide menos movimiento", () => {
    stubReducedMotion(true);
    const { nav, scrollTo } = buildNav(true);
    renderHook(() => useCenterActiveTab({ current: nav }, "correo"));

    expect(scrollTo).toHaveBeenCalledWith({ left: 400, behavior: "auto" });
  });

  it("no baja de 0 cuando la pestaña activa está al inicio", () => {
    const { nav, tab, scrollTo } = buildNav(true);
    setMeasure(tab, "offsetLeft", 10);
    renderHook(() => useCenterActiveTab({ current: nav }, "fiscales"));

    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "smooth" });
  });

  it("no hace scroll si no hay pestaña activa", () => {
    const { nav, scrollTo } = buildNav(false);
    renderHook(() => useCenterActiveTab({ current: nav }, "correo"));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("no hace scroll mientras está deshabilitado y centra al habilitarse", () => {
    const { nav, scrollTo } = buildNav(true);
    const ref = { current: nav };
    const { rerender } = renderHook(
      ({ enabled }) => useCenterActiveTab(ref, "correo", enabled),
      { initialProps: { enabled: false } },
    );
    expect(scrollTo).not.toHaveBeenCalled();

    rerender({ enabled: true });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});
