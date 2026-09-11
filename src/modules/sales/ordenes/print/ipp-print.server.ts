import ipp from "ipp";
import type { ImpresoraPrintTarget } from "@/modules/configurator/impresoras/services/impresoras.service";

function buildIppUrls(target: ImpresoraPrintTarget): string[] {
  const host = target.hostIp?.trim();
  if (!host) return [];

  const port = target.puerto && target.puerto > 0 ? target.puerto : 631;
  const scheme = target.usaTls ? "https" : "http";
  const base = `${scheme}://${host}:${port}`;
  const cola = target.colaNombre?.trim().replace(/^\/+/, "");

  const urls: string[] = [];
  if (cola) {
    urls.push(`${base}/${cola}`);
    urls.push(`${base}/ipp/print/${cola}`);
  }
  urls.push(
    `${base}/ipp/print`,
    `${base}/ipp/printer`,
    `${base}/ipp`,
    `${base}/`,
  );
  return [...new Set(urls)];
}

function executePrintJob(
  printerUrl: string,
  pdf: Buffer,
  jobName: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const printer = ipp.Printer(printerUrl);
    printer.execute(
      "Print-Job",
      {
        "operation-attributes-tag": {
          "requesting-user-name": "polaria",
          "job-name": jobName.slice(0, 80),
          "document-format": "application/pdf",
        },
        data: pdf,
      },
      (err: Error | null, res: { statusCode?: string } | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        const status = res?.statusCode ?? "";
        if (status && !/^successful/i.test(status)) {
          reject(new Error(`IPP respondió: ${status}`));
          return;
        }
        resolve();
      },
    );
  });
}

/**
 * Envía el PDF por IPP a la impresora de red.
 * Solo funciona si este proceso Node puede alcanzar host_ip (misma LAN).
 * Desde Vercel (nube) una IP privada como 10.x fallará → el cliente usa QZ Tray.
 */
export async function printPdfViaIpp(input: {
  target: ImpresoraPrintTarget;
  pdfBase64: string;
  jobName: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const urls = buildIppUrls(input.target);
  if (urls.length === 0) {
    return {
      ok: false,
      error: "La impresora no tiene IP/hostname configurado para IPP.",
    };
  }

  let pdf: Buffer;
  try {
    pdf = Buffer.from(input.pdfBase64, "base64");
  } catch {
    return { ok: false, error: "PDF inválido." };
  }

  if (pdf.length < 100) {
    return { ok: false, error: "PDF vacío o demasiado pequeño." };
  }

  const errors: string[] = [];
  for (const url of urls) {
    try {
      await executePrintJob(url, pdf, input.jobName);
      return { ok: true, url };
    } catch (err) {
      errors.push(
        `${url}: ${err instanceof Error ? err.message : "falló"}`,
      );
    }
  }

  return {
    ok: false,
    error:
      errors[0] ??
      "No se pudo alcanzar la impresora por IPP desde el servidor.",
  };
}
