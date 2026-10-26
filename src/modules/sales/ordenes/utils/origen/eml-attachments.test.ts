import { describe, expect, it } from "vitest";
import { listEmlAttachmentParts } from "./eml-attachments";

function buildMimeWithPdf(): Buffer {
  const boundary = "BOUND123";
  const pdfBody = Buffer.from("%PDF-1.4 fake pdf content for test");
  const pdfB64 = pdfBody.toString("base64");
  const mime = [
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "MIME-Version: 1.0",
    "Subject: Pedido de prueba",
    "From: hotel@example.com",
    "To: pedidos@polaria.co",
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    "Hola, adjunto la OC.",
    "",
    `--${boundary}`,
    'Content-Type: application/pdf; name="OC-255370.pdf"',
    'Content-Disposition: attachment; filename="OC-255370.pdf"',
    "Content-Transfer-Encoding: base64",
    "",
    pdfB64,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return Buffer.from(mime, "utf8");
}

describe("listEmlAttachmentParts", () => {
  it("extrae PDFs reales y omite el cuerpo", async () => {
    const parts = await listEmlAttachmentParts(buildMimeWithPdf());
    expect(parts).toHaveLength(1);
    expect(parts[0]?.nombre).toBe("OC-255370.pdf");
    expect(parts[0]?.mime).toContain("pdf");
    expect(parts[0]?.bytes).toBeGreaterThan(10);
  });
});
