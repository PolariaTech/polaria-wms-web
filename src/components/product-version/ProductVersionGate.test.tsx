import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/shared/useProductVersionCheck", () => ({
  useProductVersionCheck: vi.fn(),
}));

vi.mock("@/lib/product-version/reload-with-cache-clear", () => ({
  reloadWithCacheClear: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/utils/use-body-scroll-lock", () => ({
  useBodyScrollLock: vi.fn(),
}));

import { useProductVersionCheck } from "@/hooks/shared/useProductVersionCheck";
import { reloadWithCacheClear } from "@/lib/product-version/reload-with-cache-clear";
import { ProductVersionGate } from "./ProductVersionGate";

describe("ProductVersionGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no renderiza nada si no hay update", () => {
    vi.mocked(useProductVersionCheck).mockReturnValue({
      updateAvailable: false,
    });
    const { container } = render(<ProductVersionGate />);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el modal bloqueante y recarga al aceptar (REQ-293)", async () => {
    vi.mocked(useProductVersionCheck).mockReturnValue({
      updateAvailable: true,
    });
    const user = userEvent.setup();
    render(<ProductVersionGate />);

    expect(
      screen.getByRole("alertdialog", { name: "Nueva versión" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Hay una nueva versión en este momento/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Aceptar" }));
    await waitFor(() => {
      expect(reloadWithCacheClear).toHaveBeenCalledTimes(1);
    });
  });
});
