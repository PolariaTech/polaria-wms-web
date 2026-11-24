import {
  caminoFromModoEnvio,
  type ImpresoraCamino,
  type ImpresoraListRow,
  type ImpresoraPais,
} from "@/modules/configurator/impresoras/services/impresoras.service";

export interface ImpresoraCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  impresora?: ImpresoraListRow | null;
  /** Si viene, la impresora queda fijada a esa cuenta (cockpit de cuenta). */
  lockedCodigoCuenta?: string | null;
}

export const CAMINOS: ReadonlyArray<{
  id: ImpresoraCamino;
  title: string;
  hint: string;
}> = [
  {
    id: "qz",
    title: "QZ Tray",
    hint: "PC local con Windows",
  },
  {
    id: "brother_email",
    title: "Brother",
    hint: "Envío por correo",
  },
  {
    id: "epson_connect",
    title: "Epson Connect",
    hint: "Nube Epson",
  },
];

export const INITIAL_FORM = {
  camino: "qz" as ImpresoraCamino,
  nombre: "",
  codigoCuenta: "",
  pais: "MX" as ImpresoraPais,
  nombreSistema: "",
  emailDestino: "",
};

export function formFromImpresora(row: ImpresoraListRow): typeof INITIAL_FORM {
  return {
    camino: caminoFromModoEnvio(row.modoEnvio),
    nombre: row.nombre,
    codigoCuenta: row.codigoCuenta,
    pais: row.pais,
    nombreSistema: row.nombreSistema ?? "",
    emailDestino: row.emailDestino ?? "",
  };
}

export type ImpresoraFormState = typeof INITIAL_FORM;
