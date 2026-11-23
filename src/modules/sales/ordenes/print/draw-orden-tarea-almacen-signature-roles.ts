export type OrdenPrintSignatureRole = {
  role: string;
  esDespacho?: boolean;
  textoKeys: string[];
  fechaKeys?: string[];
};

/** Roles Alistó/Revisó/Documentación/Despachó/Retorno compartidos entre variantes de impresión. */
export const ORDEN_TAREA_ALMACEN_SIGNATURE_ROLES: readonly OrdenPrintSignatureRole[] =
  [
    {
      role: "Alistó",
      textoKeys: ["alistoNombre", "Alistó nombre", "Alistó"],
    },
    {
      role: "Revisó",
      textoKeys: ["revisoNombre", "Revisó nombre", "Revisó"],
    },
    {
      role: "Documentación",
      textoKeys: [
        "facturaOkFirma",
        "Factura (OK) firma",
        "Documentación firma",
        "facturaOkNombre",
        "Factura (OK) nombre",
        "Documentación nombre",
        "Documentación",
      ],
    },
    {
      role: "Despachó",
      esDespacho: true,
      textoKeys: [
        "despachoFirma",
        "Despachó firma",
        "despachoNombre",
        "Despachó nombre",
      ],
      fechaKeys: [
        "despachoFecha",
        "Despachó fecha",
        "despachoHora",
        "Despachó hora",
      ],
    },
    {
      role: "Retorno",
      textoKeys: ["retornoNombre", "Retorno nombre", "Retorno"],
    },
  ];