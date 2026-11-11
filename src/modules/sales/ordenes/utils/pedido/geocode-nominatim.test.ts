import { describe, expect, it, vi, afterEach } from "vitest";
import { buscarDireccionNominatim } from "./geocode-nominatim";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("geocode-nominatim (REQ-251)", () => {
  it("no busca con query corta", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(buscarDireccionNominatim("ab")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mapea resultados de Nominatim y pide sesgo México", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "20.63",
          lon: "-87.07",
          display_name: "Playa del Carmen, Q. Roo",
        },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);
    const hits = await buscarDireccionNominatim("Playa del Carmen");
    expect(hits).toEqual([
      {
        lat: 20.63,
        lng: -87.07,
        displayName: "Playa del Carmen, Q. Roo",
      },
    ]);
    const llamado = String(fetchMock.mock.calls[0]?.[0] ?? "");
    expect(llamado).toContain("countrycodes=mx");
  });
});
