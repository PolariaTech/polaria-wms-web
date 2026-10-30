import { describe, expect, it } from "vitest";
import {
  isLikelyVercelPreviewHost,
  isLikelyVercelPreviewOrigin,
  resolveCapturaOrdenOrigin,
} from "./resolve-captura-orden-origin";

describe("isLikelyVercelPreviewHost", () => {
  it("detecta deployment URL con hash (caso QR OV-941)", () => {
    expect(
      isLikelyVercelPreviewHost(
        "polaria-wms-rjvsxq7sn-luiscantilloos-projects.vercel.app",
      ),
    ).toBe(true);
  });

  it("detecta preview git", () => {
    expect(
      isLikelyVercelPreviewHost(
        "polaria-wms-web-git-main-polariatech.vercel.app",
      ),
    ).toBe(true);
  });

  it("no marca dominio de producción estable sin hash", () => {
    expect(isLikelyVercelPreviewHost("polaria-wms-web.vercel.app")).toBe(
      false,
    );
  });

  it("no marca localhost", () => {
    expect(isLikelyVercelPreviewHost("localhost")).toBe(false);
  });
});

describe("resolveCapturaOrdenOrigin", () => {
  it("prioriza NEXT_PUBLIC_APP_URL / configured", () => {
    expect(
      resolveCapturaOrdenOrigin({
        configuredAppUrl: "https://polaria-wms-web.vercel.app/",
        windowOrigin:
          "https://polaria-wms-rjvsxq7sn-luiscantilloos-projects.vercel.app",
      }),
    ).toBe("https://polaria-wms-web.vercel.app");
  });

  it("rechaza window origin de preview si no hay APP_URL", () => {
    expect(
      resolveCapturaOrdenOrigin({
        configuredAppUrl: "",
        windowOrigin:
          "https://polaria-wms-rjvsxq7sn-luiscantilloos-projects.vercel.app",
      }),
    ).toBe("");
  });

  it("permite localhost sin APP_URL", () => {
    expect(
      resolveCapturaOrdenOrigin({
        configuredAppUrl: "",
        windowOrigin: "http://localhost:3000",
      }),
    ).toBe("http://localhost:3000");
  });

  it("rechaza APP_URL si ella misma es preview", () => {
    expect(
      resolveCapturaOrdenOrigin({
        configuredAppUrl:
          "https://polaria-wms-abc12345-team-projects.vercel.app",
        windowOrigin: "http://localhost:3000",
      }),
    ).toBe("");
  });

  it("isLikelyVercelPreviewOrigin parsea URL", () => {
    expect(
      isLikelyVercelPreviewOrigin(
        "https://polaria-wms-rjvsxq7sn-luiscantilloos-projects.vercel.app/captura",
      ),
    ).toBe(true);
  });
});
