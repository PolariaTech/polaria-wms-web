import { describe, expect, it } from "vitest";
import {
  jsonOrRedirect,
  noCache,
  readFotoFromForm,
  readOtFromRequest,
  wantsDocumentResponse,
} from "./captura-respuestas";
import { NextResponse } from "next/server";

function peticion(url: string, encabezados: Record<string, string> = {}): Request {
  return new Request(url, { method: "POST", headers: encabezados });
}

describe("wantsDocumentResponse", () => {
  it("una navegación del navegador (formulario nativo) pide documento", () => {
    expect(wantsDocumentResponse(peticion("http://x/a", { "sec-fetch-mode": "navigate" }))).toBe(true);
    expect(wantsDocumentResponse(peticion("http://x/a", { accept: "text/html" }))).toBe(true);
  });

  it("fetch con JSON no pide documento", () => {
    expect(wantsDocumentResponse(peticion("http://x/a", { accept: "application/json" }))).toBe(false);
    expect(wantsDocumentResponse(peticion("http://x/a", { accept: "text/html, application/json" }))).toBe(false);
    expect(wantsDocumentResponse(peticion("http://x/a"))).toBe(false);
  });
});

describe("readOtFromRequest", () => {
  it("prefiere la OT de la URL y si no, la del formulario", () => {
    const form = new FormData();
    form.set("ot", "pedido:9|almacen:b");

    expect(readOtFromRequest(peticion("http://x/a?ot=pedido%3A1%7Calmacen%3Aa"), form)).toBe(
      "pedido:1|almacen:a",
    );
    expect(readOtFromRequest(peticion("http://x/a"), form)).toBe("pedido:9|almacen:b");
    expect(readOtFromRequest(peticion("http://x/a"))).toBe("");
  });
});

describe("readFotoFromForm", () => {
  it("lee la foto de cualquiera de los tres nombres de campo y descarta las vacías", () => {
    const form = new FormData();
    form.set("file", new File([new Uint8Array([1, 2])], "a.jpg", { type: "image/jpeg" }));
    expect(readFotoFromForm(form)?.name).toBe("a.jpg");

    const vacio = new FormData();
    vacio.set("foto", new File([], "vacia.jpg"));
    expect(readFotoFromForm(vacio)).toBeNull();
    expect(readFotoFromForm(new FormData())).toBeNull();
  });
});

describe("jsonOrRedirect", () => {
  it("para fetch devuelve JSON con el código pedido", async () => {
    const respuesta = jsonOrRedirect(peticion("http://x/a"), "ov-1", "", { ok: true }, 202);

    expect(respuesta.status).toBe(202);
    await expect(respuesta.json()).resolves.toEqual({ ok: true });
  });

  it("para formulario nativo redirige a la pantalla con el resultado", () => {
    const encabezados = { "sec-fetch-mode": "navigate" };

    const bien = jsonOrRedirect(peticion("http://x/a", encabezados), "ov-1", "ot-1", { precisionEstimada: 70 }, 200);
    const mal = jsonOrRedirect(peticion("http://x/a", encabezados), "ov-1", "ot-1", { error: "x".repeat(300) }, 422);

    expect(bien.status).toBe(303);
    expect(bien.headers.get("location")).toContain("captura=ok");
    expect(bien.headers.get("location")).toContain("precision=70");
    expect(mal.headers.get("location")).toContain("captura=error");
    expect(new URL(mal.headers.get("location") ?? "").searchParams.get("msg")).toHaveLength(180);
  });
});

describe("noCache", () => {
  it("evita que el navegador guarde el estado de las fotos", () => {
    expect(noCache(NextResponse.json({})).headers.get("Cache-Control")).toBe("no-store");
  });
});
