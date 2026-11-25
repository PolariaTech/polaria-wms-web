import {
  ESPERA_INTERPRETAR,
  ESPERA_REORGANIZAR,
  ESPERA_RELEER,
} from "../../utils/ot/aplicar-correccion-correo";
import { CargaConPolo } from "./OrdenVentaCorreccionCorreoPanel";

const CLASE_AVISO =
  "rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 text-[0.9375rem] leading-relaxed text-polaria-w lg:text-base";
const CLASE_ERROR =
  "rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 text-[0.9375rem] leading-relaxed text-polaria-danger lg:text-base";

export interface ReagruparOtMensajesProps {
  aviso: string | null;
  error: string | null;
  errorCorreccion: string | null;
  cargando: boolean;
  interpretando: boolean;
  leyendoCorreo: boolean;
  motivoActual: string;
  onCancelarPeticion: () => void;
}

/** Aviso, errores y capa de carga del modal de reagrupación. */
export function ReagruparOtMensajes({
  aviso,
  error,
  errorCorreccion,
  cargando,
  interpretando,
  leyendoCorreo,
  motivoActual,
  onCancelarPeticion,
}: ReagruparOtMensajesProps) {
  return (
    <>
      {aviso ? (
        <p role="status" className={CLASE_AVISO}>
          {aviso}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className={CLASE_ERROR}>
          {error}
        </p>
      ) : null}

      {errorCorreccion ? (
        <p role="alert" className={CLASE_ERROR}>
          {errorCorreccion}
        </p>
      ) : null}

      {cargando ? (
        interpretando ? (
          <CargaConPolo
            titulo="Entendiendo tu instrucción…"
            espera={ESPERA_INTERPRETAR}
            onCancelar={onCancelarPeticion}
          />
        ) : leyendoCorreo ? (
          <CargaConPolo
            titulo="Releyendo el correo y los archivos…"
            detalle={motivoActual}
            espera={ESPERA_RELEER}
            onCancelar={onCancelarPeticion}
          />
        ) : (
          <CargaConPolo
            titulo="Reorganizando las órdenes de trabajo…"
            detalle={motivoActual}
            espera={ESPERA_REORGANIZAR}
            onCancelar={onCancelarPeticion}
          />
        )
      ) : null}
    </>
  );
}
