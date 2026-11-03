import { describe, expect, it } from "vitest";
import {
  armarDocumentoDelCorreo,
  esVistaPreviaSegura,
  finDelDiaColombia,
  formatearFechaCompleta,
  formatearRecibido,
  formatearTamano,
  inicioDelDiaColombia,
  mensajeDeError,
  sanearHtmlDelCorreo,
  separarAdjuntos,
  separarDirecciones,
  tieneImagenesExternas,
} from "./correos-formato";

describe("formatearRecibido", () => {
  it("muestra la hora de Colombia (UTC-5) y tolera fechas vacías o inválidas", () => {
    expect(formatearRecibido("2026-11-03T13:27:51.000Z")).toMatch(/0?8:27/);
    expect(formatearRecibido(null)).toBe("—");
    expect(formatearRecibido("no-es-fecha")).toBe("—");
  });
});

describe("separarAdjuntos", () => {
  it("reparte los nombres que el flujo guarda separados por « | »", () => {
    expect(separarAdjuntos("PO_2000.pdf | detalle.xlsx |  foto.jpg ")).toEqual([
      "PO_2000.pdf",
      "detalle.xlsx",
      "foto.jpg",
    ]);
  });

  it("un solo adjunto, o ninguno, también funciona", () => {
    expect(separarAdjuntos("PO_2000.pdf")).toEqual(["PO_2000.pdf"]);
    expect(separarAdjuntos("")).toEqual([]);
    expect(separarAdjuntos(null)).toEqual([]);
    expect(separarAdjuntos(" | ")).toEqual([]);
  });
});

describe("separarDirecciones", () => {
  it("separa nombre y correo, y reparte varios destinatarios", () => {
    expect(
      separarDirecciones(
        '"Ana Torres" <ana@restaurantemar.example>, ventas@aguacates.example, Pedidos ADP <pedidos@aguacates.example>',
      ),
    ).toEqual([
      { nombre: "Ana Torres", correo: "ana@restaurantemar.example" },
      { nombre: null, correo: "ventas@aguacates.example" },
      { nombre: "Pedidos ADP", correo: "pedidos@aguacates.example" },
    ]);
  });

  it("una coma dentro de las comillas no parte a la persona", () => {
    expect(separarDirecciones('"Torres, Ana" <ana@x.example>, b@x.example')).toEqual([
      { nombre: "Torres, Ana", correo: "ana@x.example" },
      { nombre: null, correo: "b@x.example" },
    ]);
  });

  it("tolera vacíos y direcciones sin nombre", () => {
    expect(separarDirecciones(null)).toEqual([]);
    expect(separarDirecciones("  ")).toEqual([]);
    expect(separarDirecciones("<solo@x.example>")).toEqual([
      { nombre: null, correo: "solo@x.example" },
    ]);
  });
});

describe("formatearFechaCompleta", () => {
  it("muestra la fecha larga en hora de Colombia, sin segundos", () => {
    const texto = formatearFechaCompleta("2026-11-03T13:27:51.000Z");
    expect(texto).toMatch(/3 de noviembre de 2026/);
    expect(texto).not.toMatch(/:51/);
  });

  it("tolera fechas vacías o inválidas", () => {
    expect(formatearFechaCompleta(null)).toBe("—");
    expect(formatearFechaCompleta("no-es-fecha")).toBe("—");
  });

  it("los límites del día son los de Colombia (UTC-5)", () => {
    expect(inicioDelDiaColombia("2026-11-03")).toBe("2026-11-03T00:00:00.000-05:00");
    expect(finDelDiaColombia("2026-11-03")).toBe("2026-11-03T23:59:59.999-05:00");
  });
});

describe("formatearTamano", () => {
  it.each([
    [0, "0 B"],
    [812, "812 B"],
    [1024, "1 KB"],
    [48_213, "47,1 KB"],
    [1_048_576, "1 MB"],
    [2_500_000, "2,4 MB"],
  ])("%i bytes se muestra como %s", (bytes, texto) => {
    expect(formatearTamano(bytes)).toBe(texto);
  });
});

describe("esVistaPreviaSegura", () => {
  it("acepta PDF e imágenes que no ejecutan nada", () => {
    for (const tipo of ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]) {
      expect(esVistaPreviaSegura(tipo)).toBe(true);
    }
  });

  it("rechaza SVG, HTML y cualquier otro tipo, aunque lo diga el correo", () => {
    for (const tipo of ["image/svg+xml", "text/html", "application/x-msdownload", "application/pdf; x", "pdf", ""]) {
      expect(esVistaPreviaSegura(tipo)).toBe(false);
    }
  });
});

describe("sanearHtmlDelCorreo", () => {
  it("quita lo que ejecuta, redirige o envía datos", () => {
    const limpio = sanearHtmlDelCorreo(
      '<p onclick="a()">Hola</p><script>b()</script><iframe src="x"></iframe><form action="y"><input></form>' +
        '<object data="z"></object><embed src="w"><meta http-equiv="refresh" content="0;url=q"><base href="r"><link rel="stylesheet" href="s">',
    );
    for (const peligro of ["onclick", "<script", "<iframe", "<form", "<object", "<embed", "<meta", "<base", "<link"]) {
      expect(limpio).not.toContain(peligro);
    }
    expect(limpio).toContain("Hola");
  });

  it("quita los enlaces javascript: pero respeta los normales", () => {
    const limpio = sanearHtmlDelCorreo(
      '<a href="javascript:robar()">malo</a><a href="https://example.com/ok">bueno</a>',
    );
    expect(limpio).not.toContain("javascript:");
    expect(limpio).toContain('href="https://example.com/ok"');
  });

  it("hace que los enlaces abran en otra pestaña sin acceso a la original", () => {
    const limpio = sanearHtmlDelCorreo('<a href="https://example.com">ir</a>');
    expect(limpio).toContain('target="_blank"');
    expect(limpio).toContain('rel="noopener noreferrer"');
  });
});

describe("tieneImagenesExternas", () => {
  it("detecta las de internet y no las incrustadas", () => {
    expect(tieneImagenesExternas('<img src="https://x.example/p.png">')).toBe(true);
    expect(tieneImagenesExternas("<img alt='a' src='http://x.example/p.png'>")).toBe(true);
    expect(tieneImagenesExternas('<img src="data:image/png;base64,AAAA">')).toBe(false);
    expect(tieneImagenesExternas("<p>sin imágenes</p>")).toBe(false);
  });
});

describe("armarDocumentoDelCorreo", () => {
  const base = { html: "<p>Hola</p>", texto: "", permitirImagenes: false };

  it("trae una política que bloquea todo salvo estilos y las imágenes incrustadas", () => {
    const documento = armarDocumentoDelCorreo(base);
    expect(documento).toContain("default-src 'none'");
    expect(documento).toContain("img-src data: blob:;");
    expect(documento).toContain("style-src 'unsafe-inline'");
    expect(documento).not.toMatch(/script-src|connect-src|form-action/);
  });

  it("solo permite las imágenes de internet si se piden", () => {
    expect(armarDocumentoDelCorreo({ ...base, permitirImagenes: true })).toContain(
      "img-src data: blob: https:;",
    );
  });

  it("sin HTML muestra el texto escapado, para que no se interprete", () => {
    const documento = armarDocumentoDelCorreo({ html: "  ", texto: "a <b> & c", permitirImagenes: false });
    expect(documento).toContain("<pre>a &lt;b&gt; &amp; c</pre>");
  });
});

describe("mensajeDeError", () => {
  it("usa el mensaje del error y, si no hay, uno genérico", () => {
    expect(mensajeDeError(new Error("Falló la red."))).toBe("Falló la red.");
    expect(mensajeDeError(new Error(""))).toMatch(/inesperado/);
    expect(mensajeDeError("texto suelto")).toMatch(/inesperado/);
  });
});
