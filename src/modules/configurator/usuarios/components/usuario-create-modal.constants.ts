import type { WmsRol } from "@/constants/wms/roles";

export interface UsuarioCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  lockedCodigoCuenta?: string;
}

export const INITIAL_FORM = {
  nombre: "",
  idRol: "" as WmsRol | "",
  codigoCuenta: "",
  idBodega: "",
  correo: "",
  clave: "",
  accesoWms: true,
  accesoMateo: true,
};

export type UsuarioFormState = typeof INITIAL_FORM;
