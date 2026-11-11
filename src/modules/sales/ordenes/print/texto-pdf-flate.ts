import { inflateSync } from "node:zlib";

export function textoPdf(pdf: {
  output: (tipo: "arraybuffer") => ArrayBuffer;
}): string {
  const crudo = Buffer.from(pdf.output("arraybuffer"));
  const partes: string[] = [];
  for (let cursor = 0; cursor < crudo.length; ) {
    const marca = crudo.indexOf("stream", cursor);
    if (marca < 0) break;
    const previo = crudo
      .subarray(Math.max(0, marca - 180), marca)
      .toString("latin1");
    const largos = [...previo.matchAll(/\/Length\s+(\d+)(?!\s+\d+\s+R)/g)];
    const inicio = marca + (crudo[marca + 6] === 13 ? 8 : 7);
    const declarado = Number(largos.at(-1)?.[1] ?? 0);
    const fin =
      declarado > 0 ? inicio + declarado : crudo.indexOf("endstream", inicio);
    const cuerpo = crudo.subarray(inicio, Math.max(fin, inicio));
    try {
      partes.push(inflateSync(cuerpo).toString("latin1"));
    } catch {
      partes.push(cuerpo.toString("latin1"));
    }
    cursor = Math.max(fin, marca + 6) + 1;
  }
  return partes.join("\n");
}
