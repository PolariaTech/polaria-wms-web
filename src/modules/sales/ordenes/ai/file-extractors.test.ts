// @vitest-environment node
//
// El repo corre vitest con `environment: "jsdom"` por defecto (vitest.config.ts) para
// los tests de componentes React. `file-extractors.ts` es un módulo 100% backend
// (usa `file-type` sobre Buffers de Node) y bajo jsdom su Buffer/Uint8Array vive en un
// realm distinto al que espera `file-type`, lo que revienta `fileTypeFromBuffer` con
// "Expected the `input` argument to be of type `Uint8Array` or `ArrayBuffer`, got
// `object`" incluso para un CSV sin relación con .eml. Forzar `node` aquí (que ya soporta
// vitest por archivo) evita ese choque de entornos sin tocar la config global.
import { describe, expect, it } from "vitest";
import { extractFiles, type ArchivoSubido } from "./file-extractors";

// GIF transparente de 1x1 — solo para probar que un adjunto "inline" (logo de firma) se
// ignora, el contenido real no importa.
const GIF_1X1_BASE64 = "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function archivoTexto(nombre: string, contenido: string): ArchivoSubido {
  return {
    originalname: nombre,
    mimetype: "text/csv",
    buffer: Buffer.from(contenido, "utf8"),
  };
}

function correoEml(nombreArchivo: string, mimeText: string): ArchivoSubido {
  return {
    originalname: nombreArchivo,
    mimetype: "message/rfc822",
    buffer: Buffer.from(mimeText, "utf8"),
  };
}

describe("extractFiles — regresión: archivo suelto sigue funcionando tras el cambio a arreglo", () => {
  it("CSV: sigue devolviendo un único ArchivoTexto", async () => {
    const resultado = await extractFiles([
      archivoTexto("pedido.csv", "producto,cantidad\nMango,20"),
    ]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].tipo).toBe("texto");
    if (resultado[0].tipo === "texto") {
      expect(resultado[0].contenido).toContain("Mango");
    }
  });
});

// 2026-09-08 (prototipo) — hallazgo real: 11 correos .eml (reenvíos de hoteles con orden
// de compra adjunta) caían enteros en no_legible porque esta extensión no tenía lector.
// Un .eml se expande en varios ArchivoExtraido (cuerpo + cada adjunto real) — ver
// extractFromEml() en file-extractors.ts. Los correos de estas pruebas son MIME
// sintéticos construidos aquí mismo, no hace falta ningún archivo fixture nuevo.
describe("extractFiles — correos .eml", () => {
  it("correo solo con cuerpo de texto plano (sin adjuntos): un único ArchivoTexto con el cuerpo", async () => {
    const mime = [
      "From: proveedor@ejemplo.com",
      "To: pedidos@polaria.tech",
      "Subject: Pedido de prueba",
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      "Buenas, para mañana necesitamos 20 kilos de aguacate extra hass.",
      "",
    ].join("\r\n");

    const resultado = await extractFiles([correoEml("pedido.eml", mime)]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].tipo).toBe("texto");
    if (resultado[0].tipo === "texto") {
      expect(resultado[0].nombre).toBe("pedido.eml — cuerpo");
      expect(resultado[0].contenido).toContain("aguacate extra hass");
    }
  });

  it("correo solo con cuerpo HTML (sin texto plano): el cuerpo se convierte con html-to-text", async () => {
    const mime = [
      "From: proveedor@ejemplo.com",
      "To: pedidos@polaria.tech",
      "Subject: Pedido en HTML",
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      "<html><body><p>Necesitamos <b>15 kilos de mango</b> para el jueves.</p></body></html>",
      "",
    ].join("\r\n");

    const resultado = await extractFiles([correoEml("pedido-html.eml", mime)]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].tipo).toBe("texto");
    if (resultado[0].tipo === "texto") {
      expect(resultado[0].contenido).toContain("15 kilos de mango");
      expect(resultado[0].contenido).not.toContain("<b>");
    }
  });

  it("correo con un adjunto de texto real + una imagen inline: 2 ítems (cuerpo + adjunto), la imagen inline no aparece", async () => {
    const boundary = "LIMITE_PRUEBA_1";
    const mime = [
      "From: proveedor@ejemplo.com",
      "To: pedidos@polaria.tech",
      "Subject: Orden de compra adjunta",
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      "Buenas, favor de surtir lo indicado en la orden de compra adjunta.",
      "",
      `--${boundary}`,
      'Content-Type: text/csv; name="orden.csv"',
      'Content-Disposition: attachment; filename="orden.csv"',
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from("producto,cantidad\nAguacate Hass,40").toString("base64"),
      "",
      `--${boundary}`,
      'Content-Type: image/gif; name="logo.gif"',
      'Content-Disposition: inline; filename="logo.gif"',
      "Content-Transfer-Encoding: base64",
      "",
      GIF_1X1_BASE64,
      "",
      `--${boundary}--`,
      "",
    ].join("\r\n");

    const resultado = await extractFiles([correoEml("orden.eml", mime)]);
    expect(resultado).toHaveLength(2);
    expect(resultado.map((r) => r.nombre)).toEqual([
      "orden.eml — cuerpo",
      "orden.eml → orden.csv",
    ]);
    expect(resultado.every((r) => r.tipo === "texto")).toBe(true);
    const adjuntoExtraido = resultado.find((r) => r.nombre === "orden.eml → orden.csv");
    if (adjuntoExtraido?.tipo === "texto") {
      expect(adjuntoExtraido.contenido).toContain("Aguacate Hass");
    }
    // La imagen inline (logo de firma) nunca debe convertirse en un ArchivoImagen.
    expect(resultado.some((r) => r.tipo === "imagen")).toBe(false);
  });

  it("correo con un adjunto de tipo no soportado: ese adjunto sale no_legible, el cuerpo se extrae igual", async () => {
    const boundary = "LIMITE_PRUEBA_2";
    const mime = [
      "From: proveedor@ejemplo.com",
      "To: pedidos@polaria.tech",
      "Subject: Pedido con adjunto viejo",
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      "Buenas, 10 kilos de mango para mañana.",
      "",
      `--${boundary}`,
      'Content-Type: application/msword; name="viejo.doc"',
      'Content-Disposition: attachment; filename="viejo.doc"',
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from("contenido binario arbitrario, no es un .doc real").toString(
        "base64",
      ),
      "",
      `--${boundary}--`,
      "",
    ].join("\r\n");

    const resultado = await extractFiles([correoEml("pedido2.eml", mime)]);
    expect(resultado).toHaveLength(2);
    const cuerpo = resultado.find((r) => r.nombre === "pedido2.eml — cuerpo");
    const adjunto = resultado.find((r) => r.nombre === "pedido2.eml → viejo.doc");
    expect(cuerpo?.tipo).toBe("texto");
    if (cuerpo?.tipo === "texto") expect(cuerpo.contenido).toContain("mango");
    expect(adjunto?.tipo).toBe("no_legible");
  });
});
