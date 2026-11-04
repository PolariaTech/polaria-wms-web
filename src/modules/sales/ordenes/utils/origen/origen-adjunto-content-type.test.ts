import { describe, expect, it } from "vitest";
import {
  isEmlOrigenAdjunto,
  isHtmlOrigenAdjunto,
  resolveAdjuntoContentType,
} from "./origen-adjunto-content-type";

describe("origen-adjunto-content-type (REQ-159)", () => {
  it("detecta HTML y EML por nombre o mime", () => {
    expect(isHtmlOrigenAdjunto({ nombre: "PO.html" })).toBe(true);
    expect(
      isHtmlOrigenAdjunto({
        nombre: "x.bin",
        mime: "text/html",
      }),
    ).toBe(true);
    expect(isEmlOrigenAdjunto({ nombre: "correo.eml" })).toBe(true);
    expect(
      isEmlOrigenAdjunto({
        nombre: "x",
        mime: "message/rfc822",
      }),
    ).toBe(true);
    expect(isHtmlOrigenAdjunto({ nombre: "a.pdf" })).toBe(false);
  });

  it("fuerza text/html aunque Storage diga octet-stream", () => {
    expect(
      resolveAdjuntoContentType("PO.html", "application/octet-stream"),
    ).toBe("text/html; charset=utf-8");
    expect(resolveAdjuntoContentType("nota.htm", null)).toBe(
      "text/html; charset=utf-8",
    );
    expect(resolveAdjuntoContentType("a.pdf", "application/octet-stream")).toBe(
      "application/pdf",
    );
  });
});
