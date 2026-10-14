import "server-only";

import nodemailer from "nodemailer";

export type EmailPrintInput = {
  to: string;
  jobName: string;
  pdfBase64: string;
  impresoraNombre: string;
};

function requireSmtpConfig(): {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
} {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim() || "587";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || user || "";

  if (!host || !user || !pass || !from) {
    throw new Error(
      "Falta SMTP_HOST / SMTP_USER / SMTP_PASS / SMTP_FROM para imprimir por correo.",
    );
  }

  const port = Number.parseInt(portRaw, 10);
  if (!Number.isFinite(port) || port < 1) {
    throw new Error("SMTP_PORT inválido.");
  }

  return { host, port, user, pass, from };
}

/** Envía el PDF como adjunto al correo de la impresora (Brother email-to-print). */
export async function printPdfViaEmail(
  input: EmailPrintInput,
): Promise<{ to: string }> {
  const to = input.to.trim().toLowerCase();
  if (!to.includes("@")) {
    throw new Error("Correo de impresora inválido.");
  }

  const smtp = requireSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  const filename = `${input.jobName.replace(/[^\w.-]+/g, "_") || "orden"}.pdf`;
  const pdfBuffer = Buffer.from(input.pdfBase64, "base64");

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: input.jobName || `Impresión ${input.impresoraNombre}`,
    text: `Documento para imprimir en ${input.impresoraNombre}.`,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return { to };
}
