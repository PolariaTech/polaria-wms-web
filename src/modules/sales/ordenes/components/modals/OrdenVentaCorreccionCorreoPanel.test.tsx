import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ESPERA_INTERPRETAR,
  ESPERA_REORGANIZAR,
  ESPERA_RELEER,
  type PropuestaCorreccionCorreoApi,
} from "../../utils/ot/aplicar-correccion-correo";
import {
  CargaConPolo,
  OrdenVentaCorreccionCorreoPanel,
  PoloWorking,
  type OrdenVentaCorreccionCorreoPanelProps,
} from "./OrdenVentaCorreccionCorreoPanel";

function propuesta(parcial: Partial<PropuestaCorreccionCorreoApi> = {}): PropuestaCorreccionCorreoApi {
  return {
    requestId: "req-1",
    propuestaId: "prop-1",
    baseHash: "h",
    documentos: [
      {
        nombre: "AGUACATES_4502987208.pdf",
        oc: "4502987208",
        ocFuente: "ambas",
        renglones: 82,
        verificacion: { totalDocumento: 11500.6, importe: 11500.6, diferencia: 0, cuadra: true },
        relecturaPorBloques: false,
      },
    ],
    ots: [
      {
        id: "pedido:4502987208|almacen:abar",
        etiqueta: "4502987208 — ABAR",
        numeroPedido: "4502987208",
        almacen: "ABAR",
        totalCantidad: 2,
        renglones: [{ Producto: "AGUACATE", Cantidad: 2 }],
      },
    ],
    resumen: {
      otAntes: 6,
      otDespues: 12,
      renglonesAntes: 60,
      renglonesDespues: 82,
      importeAntes: 100,
      importeDespues: 11500.6,
    },
    diff: { otNuevas: ["a", "b"], otEliminadas: [], renglonesAgregados: 22, renglonesQuitados: 0 },
    advertencias: [{ codigo: "ADJUNTO_DUPLICADO", detalle: "Adjunto leído una sola vez." }],
    ...parcial,
  };
}

function montar(extra: Partial<OrdenVentaCorreccionCorreoPanelProps> = {}) {
  const props: OrdenVentaCorreccionCorreoPanelProps = {
    propuesta: propuesta(),
    motivo: "Pide verificar contra la factura.",
    onAplicar: vi.fn(),
    onDescartar: vi.fn(),
    ...extra,
  };
  render(<OrdenVentaCorreccionCorreoPanel {...props} />);
  return props;
}

describe("PoloWorking", () => {
  it("pinta la escena de planta de la marca como imagen decorativa y a un tamaño que la marca permite", () => {
    const { container } = render(<PoloWorking />);
    const img = container.querySelector("img")!;

    expect(img.getAttribute("alt")).toBe("");
    expect(Number(img.getAttribute("width"))).toBeGreaterThanOrEqual(64);
    const svg = decodeURIComponent(img.getAttribute("src")!.replace("data:image/svg+xml;charset=utf-8,", ""));
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('id="planta"');
    // Va sin la baldosa de fondo: la carga trae su propia tarjeta oscura.
    expect(svg).not.toContain('id="baldosa"');
    expect(svg).toContain("prefers-reduced-motion");
    // Tema claro: la misma escena CON su baldosa oscura, para que lo blanco se lea.
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]!.className).toContain('[html[data-theme="light"]_&]:hidden');
    expect(imgs[1]!.className).toContain('hidden [html[data-theme="light"]_&]:block');
    const conBaldosa = decodeURIComponent(
      imgs[1]!.getAttribute("src")!.replace("data:image/svg+xml;charset=utf-8,", ""),
    );
    expect(conBaldosa).toContain('id="baldosa"');
    // Solo colores de la marca (tokens.css).
    const colores = new Set(svg.match(/#[0-9a-fA-F]{6}/g)!.map((c) => c.toLowerCase()));
    expect([...colores].sort()).toEqual(["#00a591", "#00e5cc", "#020609", "#f8f8f6"]);
  });
});

describe("CargaConPolo", () => {
  it("dice qué se hace, lo que se entendió y cuánto suele tardar, como estado anunciado", () => {
    render(
      <CargaConPolo
        titulo="Releyendo el correo y los archivos…"
        detalle="Pide verificar contra la factura."
        espera={ESPERA_RELEER}
      />,
    );

    const estado = screen.getByRole("status");
    expect(estado.getAttribute("aria-live")).toBe("polite");
    expect(screen.getByText("Releyendo el correo y los archivos…")).toBeTruthy();
    expect(screen.getByText("Pide verificar contra la factura.")).toBeTruthy();
    expect(screen.getByText("Este proceso puede tardar entre 1 y 3 minutos.")).toBeTruthy();
  });

  it("es una capa independiente sobre el modal: diálogo modal en un portal a body, nombrado por su título", () => {
    const { container } = render(
      <CargaConPolo titulo="Releyendo el correo y los archivos…" espera={ESPERA_RELEER} onCancelar={vi.fn()} />,
    );

    // Fuera del contenedor del componente: vive en document.body, no dentro del modal.
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    const dialogo = screen.getByRole("dialog", { name: "Releyendo el correo y los archivos…" });
    expect(dialogo.getAttribute("aria-modal")).toBe("true");
    expect(document.body.contains(dialogo)).toBe(true);
    expect(dialogo.parentElement!.className).toContain("fixed");
  });

  it("trae su propio «Cancelar», rojo con letra blanca al pasar el cursor, con el foco en él y fuera de la región que se anuncia", () => {
    render(<CargaConPolo titulo="Entendiendo…" espera={ESPERA_INTERPRETAR} onCancelar={vi.fn()} />);

    const boton = screen.getByRole("button", { name: "Cancelar" });
    expect(document.activeElement).toBe(boton);
    expect(screen.getByRole("status").contains(boton)).toBe(false);
    expect(boton.className).toContain("min-h-11");
    expect(boton.className).toContain("hover:bg-red-600");
    expect(boton.className).toContain("hover:text-polaria-w");
  });

  it("un clic en «Cancelar» NO cancela: pregunta antes, con «Seguir esperando» como opción segura", async () => {
    const onCancelar = vi.fn();
    render(<CargaConPolo titulo="Releyendo…" espera={ESPERA_RELEER} onCancelar={onCancelar} />);
    const usuario = userEvent.setup();

    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).not.toHaveBeenCalled();
    const alerta = screen.getByRole("alertdialog");
    expect(alerta.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("¿Seguro que quieres cancelar este proceso?")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Seguir esperando" }));
    // Polo y el estado siguen ahí: el proceso no se detuvo.
    expect(screen.getByText("Releyendo…")).toBeTruthy();

    await usuario.click(screen.getByRole("button", { name: "Seguir esperando" }));
    expect(onCancelar).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancelar" }));
  });

  it("«Sí, cancelar» sí cancela, y es rojo desde el inicio", async () => {
    const onCancelar = vi.fn();
    render(<CargaConPolo titulo="Releyendo…" espera={ESPERA_RELEER} onCancelar={onCancelar} />);
    const usuario = userEvent.setup();

    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    const confirmar = screen.getByRole("button", { name: "Sí, cancelar" });
    expect(confirmar.className).toContain("bg-red-600");
    await usuario.click(confirmar);

    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  it("Escape pide la confirmación y otro Escape la cierra: nunca cancela de golpe", async () => {
    const onCancelar = vi.fn();
    render(<CargaConPolo titulo="Releyendo…" espera={ESPERA_RELEER} onCancelar={onCancelar} />);

    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(await screen.findByRole("alertdialog")).toBeTruthy();
    expect(onCancelar).not.toHaveBeenCalled();

    fireEvent.keyDown(document.body, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onCancelar).not.toHaveBeenCalled();
  });

  it("en la confirmación Tab circula solo entre sus dos botones", async () => {
    render(<CargaConPolo titulo="Releyendo…" espera={ESPERA_RELEER} onCancelar={vi.fn()} />);
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    const seguir = screen.getByRole("button", { name: "Seguir esperando" });
    const si = screen.getByRole("button", { name: "Sí, cancelar" });

    expect(document.activeElement).toBe(seguir);
    await usuario.tab();
    expect(document.activeElement).toBe(si);
    await usuario.tab();
    expect(document.activeElement).toBe(seguir);
    await usuario.tab({ shift: true });
    expect(document.activeElement).toBe(si);
  });

  it("sin onCancelar no muestra botón y el foco queda en el propio diálogo", () => {
    render(<CargaConPolo titulo="Entendiendo…" espera={ESPERA_INTERPRETAR} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  it("Tab no saca el foco de la capa (aria-modal)", async () => {
    render(<CargaConPolo titulo="Entendiendo…" espera={ESPERA_INTERPRETAR} onCancelar={vi.fn()} />);
    const usuario = userEvent.setup();
    const boton = screen.getByRole("button", { name: "Cancelar" });

    await usuario.tab();
    expect(document.activeElement).toBe(boton);
    await usuario.tab({ shift: true });
    expect(document.activeElement).toBe(boton);
  });

  it("cada etapa muestra su propio rango medido", () => {
    const { rerender } = render(<CargaConPolo titulo="a" espera={ESPERA_INTERPRETAR} />);
    expect(screen.getByText("Este proceso puede tardar entre 2 y 10 segundos.")).toBeTruthy();
    rerender(<CargaConPolo titulo="b" espera={ESPERA_REORGANIZAR} />);
    expect(screen.getByText("Este proceso puede tardar entre 5 y 30 segundos.")).toBeTruthy();
  });

  it("sin detalle no deja un hueco", () => {
    render(<CargaConPolo titulo="Entendiendo…" espera={ESPERA_INTERPRETAR} />);
    expect(screen.getAllByText(/./).length).toBe(2);
  });
});

describe("OrdenVentaCorreccionCorreoPanel", () => {
  it("muestra el antes/después, lo que se entendió, los documentos con su verificación y los avisos", () => {
    montar();

    expect(screen.getByText("6 OT → 12 OT")).toBeTruthy();
    expect(screen.getByText("Pide verificar contra la factura.")).toBeTruthy();
    expect(screen.getByText(/60 → 82 renglones/)).toBeTruthy();
    expect(screen.getByText("AGUACATES_4502987208.pdf")).toBeTruthy();
    expect(screen.getByText(/Cuadra con el total del documento/)).toBeTruthy();
    expect(screen.getByText("Adjunto leído una sola vez.")).toBeTruthy();
  });

  it("cada aviso nombra el archivo al que se refiere (sin la parte del .eml) y los avisos iguales se distinguen", () => {
    montar({
      propuesta: propuesta({
        advertencias: [
          {
            codigo: "ADJUNTO_DUPLICADO",
            documento: "correo.eml → AGUACATES_4502987208.pdf",
            detalle: "Adjunto incrustado en el .eml que también se subió suelto: se leyó una sola vez.",
          },
          {
            codigo: "ADJUNTO_DUPLICADO",
            documento: "correo.eml → AGUACATES_4502987081.pdf",
            detalle: "Adjunto incrustado en el .eml que también se subió suelto: se leyó una sola vez.",
          },
        ],
      }),
    });

    const avisos = within(screen.getByRole("list", { name: "Avisos" })).getAllByRole("listitem");
    expect(avisos).toHaveLength(2);
    expect(avisos[0]!.textContent).toContain("AGUACATES_4502987208.pdf: Adjunto incrustado");
    expect(avisos[1]!.textContent).toContain("AGUACATES_4502987081.pdf: Adjunto incrustado");
    expect(avisos[0]!.textContent).not.toContain("correo.eml");
  });

  it("un aviso sin archivo se muestra solo con su texto", () => {
    montar();

    const aviso = within(screen.getByRole("list", { name: "Avisos" })).getByRole("listitem");
    expect(aviso.textContent).toBe("Adjunto leído una sola vez.");
  });

  it("respeta el singular de «renglón» en lo que se quita, en lo que se agrega y en cada documento", () => {
    montar({
      propuesta: propuesta({
        diff: { otNuevas: ["a"], otEliminadas: [], renglonesAgregados: 1, renglonesQuitados: 1 },
        documentos: [
          {
            nombre: "UNO.pdf",
            oc: "4500000001",
            renglones: 1,
            ocFuente: "ambas",
            verificacion: { cuadra: true, totalDocumento: 10, importe: 10, diferencia: 0 },
            relecturaPorBloques: false,
          },
        ],
      }),
    });

    expect(screen.getByText(/1 renglón agregados\./)).toBeTruthy();
    expect(screen.getByText(/1 renglón que no está en los documentos se quita\./)).toBeTruthy();
    expect(screen.getByText(/^· 1 renglón$/)).toBeTruthy();
  });

  it("aplicar entrega la propuesta y descartar avisa", async () => {
    const usuario = userEvent.setup();
    const props = montar();

    await usuario.click(screen.getByRole("button", { name: /Aplicar al borrador/ }));
    expect(props.onAplicar).toHaveBeenCalledWith(expect.objectContaining({ propuestaId: "prop-1" }));

    await usuario.click(screen.getByRole("button", { name: "Descartar" }));
    expect(props.onDescartar).toHaveBeenCalled();
  });

  it("no permite aplicar si un documento declara un total que no cuadra", () => {
    montar({
      propuesta: propuesta({
        documentos: [
          {
            nombre: "x.pdf",
            oc: null,
            ocFuente: null,
            renglones: 1,
            verificacion: { totalDocumento: 100, importe: 10, diferencia: -90, cuadra: false },
            relecturaPorBloques: true,
          },
        ],
      }),
    });
    expect(screen.getByText(/No cuadra/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Aplicar al borrador/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("si la orden ya coincide con los documentos lo dice y no deja aplicar", () => {
    montar({
      propuesta: propuesta({
        diff: { otNuevas: [], otEliminadas: [], renglonesAgregados: 0, renglonesQuitados: 0 },
      }),
    });
    expect(screen.getByText(/ya coincide con los documentos/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Aplicar al borrador/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("avisa de los documentos que no se pudieron verificar", () => {
    montar({
      propuesta: propuesta({
        documentos: [
          {
            nombre: "sin-total.pdf",
            oc: null,
            ocFuente: null,
            renglones: 3,
            verificacion: { totalDocumento: null, importe: 5, diferencia: null, cuadra: null },
            relecturaPorBloques: false,
          },
        ],
      }),
    });
    expect(screen.getByText(/Revisa a mano los documentos sin total/)).toBeTruthy();
  });

  it("muestra como texto lo que viene del correo, nunca como HTML", () => {
    const { container } = render(
      <OrdenVentaCorreccionCorreoPanel
        propuesta={propuesta({
          documentos: [
            {
              nombre: "<img src=x onerror=alert(1)>.pdf",
              oc: null,
              ocFuente: null,
              renglones: 1,
              verificacion: { totalDocumento: 1, importe: 1, diferencia: 0, cuadra: true },
              relecturaPorBloques: false,
            },
          ],
          advertencias: [{ codigo: "X", detalle: "<b>negrita</b>" }],
        })}
        onAplicar={vi.fn()}
        onDescartar={vi.fn()}
      />,
    );
    // Solo puede haber la ilustración decorativa de la marca; ninguna imagen sale del contenido del correo.
    expect(container.querySelectorAll('img:not([src^="data:image/svg+xml;charset=utf-8,%3Csvg"])')).toHaveLength(0);
    expect(container.querySelector("b")).toBeNull();
    expect(screen.getByText("<b>negrita</b>")).toBeTruthy();
  });
});
