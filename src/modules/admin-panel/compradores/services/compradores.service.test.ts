import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  createCompradorAdmin,
  listCompradoresAdmin,
  updateCompradorAdmin,
} from "./compradores.service";

describe("compradores.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listCompradoresAdmin filtra por cuenta activa", async () => {
    const { client, from, chain } = createSupabaseMock({
      data: [
        {
          id_comprador: "11111111-1111-1111-1111-111111111111",
          codigo: "LUIS1",
          nombre: "Luis Castillo",
          telefono: null,
        },
      ],
    });
    setSupabaseClientForTests(client);

    const rows = await listCompradoresAdmin({ codigoCuenta: "FOODS1" });

    expect(from).toHaveBeenCalledWith("comprador");
    expect(chain.eq).toHaveBeenCalledWith("codigo_cuenta", "FOODS1");
    expect(chain.eq).toHaveBeenCalledWith("esta_activo", true);
    expect(rows).toEqual([
      {
        idComprador: "11111111-1111-1111-1111-111111111111",
        codigo: "LUIS1",
        comprador: "Luis Castillo",
        telefono: null,
        estaActivo: true,
      },
    ]);
  });

  it("createCompradorAdmin inserta comprador con código autogenerado", async () => {
    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    insertChain.single.mockResolvedValue({
      data: {
        id_comprador: "22222222-2222-2222-2222-222222222222",
        codigo: "LUIS1",
        nombre: "Luis Castillo",
      },
      error: null,
    });

    const from = vi.fn(() => insertChain);
    setSupabaseClientForTests({ from } as never);

    const row = await createCompradorAdmin({
      codigoCuenta: "FOODS1",
      nombre: "Luis Castillo",
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_cuenta: "FOODS1",
        nombre: "Luis Castillo",
        esta_activo: true,
      }),
    );
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.not.objectContaining({ metadatos_alta: expect.anything() }),
    );
    expect(row.comprador).toBe("Luis Castillo");
  });

  it("updateCompradorAdmin actualiza datos sin cambiar el código", async () => {
    const updateChain = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.select.mockReturnValue(updateChain);
    updateChain.single.mockResolvedValue({
      data: {
        id_comprador: "22222222-2222-2222-2222-222222222222",
        codigo: "LUIS1",
        nombre: "Luis Pérez",
        telefono: "+573004445566",
      },
      error: null,
    });

    const from = vi.fn(() => updateChain);
    setSupabaseClientForTests({ from } as never);

    const row = await updateCompradorAdmin({
      codigoCuenta: "FOODS1",
      idComprador: "22222222-2222-2222-2222-222222222222",
      nombre: "Luis Pérez",
      telefono: "+573004445566",
    });

    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Luis Pérez",
        telefono: "+573004445566",
      }),
    );
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.not.objectContaining({ codigo: expect.anything() }),
    );
    expect(updateChain.eq).toHaveBeenCalledWith(
      "id_comprador",
      "22222222-2222-2222-2222-222222222222",
    );
    expect(updateChain.eq).toHaveBeenCalledWith("codigo_cuenta", "FOODS1");
    expect(row.comprador).toBe("Luis Pérez");
    expect(row.codigo).toBe("LUIS1");
  });

  it("updateCompradorAdmin guarda la ficha de alta", async () => {
    const updateChain = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.select.mockReturnValue(updateChain);
    updateChain.single.mockResolvedValue({
      data: {
        id_comprador: "22222222-2222-2222-2222-222222222222",
        codigo: "LUIS1",
        nombre: "Luis Pérez",
        telefono: "+573004445566",
      },
      error: null,
    });

    const from = vi.fn(() => updateChain);
    setSupabaseClientForTests({ from } as never);

    const ficha = {
      razonSocial: "Hotel Xcaret SA",
      rfc: "EXC980411R32",
      regimen: "",
      cpFiscal: "77710",
      usoCfdi: "G01 — Adquisición de mercancías",
      constanciaNombre: "",
      constanciaFecha: "",
      apodo: "",
      grupo: "",
      vendedor: "",
      estado: "Activo",
      listaPrecios: "",
      diasCredito: "30",
      limiteCredito: "",
      metodoPago: "PPD — Parcialidades o diferido",
      formaPago: "03 — Transferencia electrónica",
      moneda: "MXN",
      exigeOc: "Sí",
      correosCfdi: "",
      complementoPago: false,
      centros: [],
      contactos: [],
      whatsapp: "",
      formatoPedido: "Texto libre",
      correosPedido: "",
      portalProveedores: false,
      portalNota: "",
      sustituciones: "No — surtir parcial",
      tolerancia: "",
      vidaUtil: "",
      requiereLote: "Sí",
      requiereTemp: "Sí",
      requiereFicha: "No",
      politicaDevolucion: "",
    };

    await updateCompradorAdmin({
      codigoCuenta: "FOODS1",
      idComprador: "22222222-2222-2222-2222-222222222222",
      nombre: "Luis Pérez",
      telefono: "+573004445566",
      ficha,
    });

    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Luis Pérez",
        razon_social: ficha.razonSocial,
        rfc: ficha.rfc,
        regimen: ficha.regimen,
        cp_fiscal: ficha.cpFiscal,
        uso_cfdi: ficha.usoCfdi,
        constancia_nombre: ficha.constanciaNombre,
        constancia_fecha: ficha.constanciaFecha,
        apodo: ficha.apodo,
        grupo: ficha.grupo,
        vendedor: ficha.vendedor,
        estado: ficha.estado,
        lista_precios: ficha.listaPrecios,
        dias_credito: ficha.diasCredito,
        limite_credito: ficha.limiteCredito,
        metodo_pago: ficha.metodoPago,
        forma_pago: ficha.formaPago,
        moneda: ficha.moneda,
        exige_oc: ficha.exigeOc,
        correos_cfdi: ficha.correosCfdi,
        complemento_pago: ficha.complementoPago,
        whatsapp: ficha.whatsapp,
        formato_pedido: ficha.formatoPedido,
        correos_pedido: ficha.correosPedido,
        portal_proveedores: ficha.portalProveedores,
        portal_nota: ficha.portalNota,
        sustituciones: ficha.sustituciones,
        tolerancia: ficha.tolerancia,
        vida_util: ficha.vidaUtil,
        requiere_lote: ficha.requiereLote,
        requiere_temp: ficha.requiereTemp,
        requiere_ficha: ficha.requiereFicha,
        politica_devolucion: ficha.politicaDevolucion,
      }),
    );
  });
});
