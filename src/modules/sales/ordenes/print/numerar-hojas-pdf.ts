import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/** La esquina de arriba a la derecha: el resumen pone su «Página 1 de 2» más abajo (15 mm) y las OC dejan margen ahí. */
const DERECHA_MM = 8;
const ARRIBA_MM = 5;
const TAMANO_PT = 8;
const GRIS = 0.35;
const PT_POR_MM = 72 / 25.4;

/**
 * «Hoja 5 de 56»: el número que usa la columna «Desde la hoja» del resumen. Con el paquete partido
 * en envíos la cuenta es de cada envío, y se dice cuál es: «Parte 2/3 · Hoja 5 de 20».
 */
export function etiquetaDeHoja(numero: number, total: number, parte?: string): string {
  return `${parte ? `Parte ${parte} · ` : ""}Hoja ${numero} de ${total}`;
}

/** Numera todas las hojas de un PDF armado con pdf-lib (el paquete con las OC de los clientes). */
export async function numerarHojasPdfLib(pdf: PDFDocument, parte?: string): Promise<void> {
  const fuente = await pdf.embedFont(StandardFonts.Helvetica);
  const paginas = pdf.getPages();
  paginas.forEach((pagina, indice) => {
    const texto = etiquetaDeHoja(indice + 1, paginas.length, parte);
    // La caja de la página puede no empezar en 0,0: se mide desde su esquina de arriba a la derecha.
    const caja = pagina.getMediaBox();
    pagina.drawText(texto, {
      x: caja.x + caja.width - DERECHA_MM * PT_POR_MM - fuente.widthOfTextAtSize(texto, TAMANO_PT),
      y: caja.y + caja.height - ARRIBA_MM * PT_POR_MM - TAMANO_PT,
      size: TAMANO_PT,
      font: fuente,
      color: rgb(GRIS, GRIS, GRIS),
    });
  });
}

/** Numera un PDF que ya viene armado (el de la impresión rápida sin OC) y lo devuelve como `Blob`. */
export async function numerarBlobPdf(blob: Blob, parte?: string): Promise<Blob> {
  const pdf = await PDFDocument.load(await blob.arrayBuffer(), { updateMetadata: false });
  await numerarHojasPdfLib(pdf, parte);
  return new Blob([(await pdf.save()) as BlobPart], { type: "application/pdf" });
}
