import { describe, expect, it } from "vitest";
import { autoPrintResultToFeedback } from "./auto-print-ov-tras-emitir";
import { MENSAJE_VERSION_NUEVA } from "./print-correo-fallo";

describe("autoPrintResultToFeedback", () => {
  it("no muestra nada si la autoimpresión no corrió", () => {
    expect(
      autoPrintResultToFeedback({ status: "skipped", reason: "flag_off" }),
    ).toBeNull();
  });

  it("un envío exitoso no es un fallo ni pide recargar", () => {
    const feedback = autoPrintResultToFeedback({
      status: "ok",
      hojas: 2,
      codigo: "OV-1",
      impresora: "Administracion",
      queue: { kind: "unknown" },
    });
    expect(feedback?.ok).toBe(true);
    expect(feedback?.versionVieja).toBeUndefined();
  });

  it("REQ-189: un ChunkLoadError pide recargar y no se trata como correo no enviado", () => {
    const feedback = autoPrintResultToFeedback({
      status: "error",
      message:
        "Failed to load chunk /_next/static/chunks/3nh_1uou5_t_9.js from module 578620",
    });
    expect(feedback).toMatchObject({
      ok: false,
      versionVieja: true,
      detail: MENSAJE_VERSION_NUEVA,
    });
  });

  it("un fallo normal conserva su aviso y no pide recargar", () => {
    const feedback = autoPrintResultToFeedback({
      status: "error",
      message: "No hay conexión con QZ Tray.",
    });
    expect(feedback?.ok).toBe(false);
    expect(feedback?.title).toBe("No se pudo imprimir");
    expect(feedback?.versionVieja).toBeUndefined();
  });

  it("sin impresora configurada sigue avisando a TI", () => {
    const feedback = autoPrintResultToFeedback({
      status: "error",
      message: "No hay impresora configurada.",
    });
    expect(feedback?.title).toBe("Sin impresora configurada");
    expect(feedback?.versionVieja).toBeUndefined();
  });
});
