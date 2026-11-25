import { Loader2 } from "lucide-react";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "./reagrupacion-modal-ui";

export interface ReagruparOtAccionesProps {
  enPropuesta: boolean;
  enDivision: boolean;
  puedeDividir: boolean;
  dividiendo: boolean;
  cargando: boolean;
  generarDeshabilitado: boolean;
  onClose: () => void;
  onRechazar: () => void;
  onConfirmar: () => void;
  onGenerar: () => void;
}

/** Botonera del modal de reagrupación: Generar/Cancelar o Confirmar/Rechazar. */
export function ReagruparOtAcciones({
  enPropuesta,
  enDivision,
  puedeDividir,
  dividiendo,
  cargando,
  generarDeshabilitado,
  onClose,
  onRechazar,
  onConfirmar,
  onGenerar,
}: ReagruparOtAccionesProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-polaria-w-08 pt-4">
      {enPropuesta ? (
        <>
          <button
            type="button"
            className={BOTON_SECUNDARIO}
            disabled={dividiendo}
            onClick={onRechazar}
          >
            Rechazar
          </button>
          <button
            type="button"
            className={BOTON_PRIMARIO}
            disabled={dividiendo || (enDivision && !puedeDividir)}
            onClick={onConfirmar}
          >
            {dividiendo && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {dividiendo ? "Dividiendo…" : "Confirmar"}
          </button>
        </>
      ) : (
        <>
          {cargando ? null : (
            <button type="button" className={BOTON_SECUNDARIO} onClick={onClose}>
              Cancelar
            </button>
          )}
          <button
            type="button"
            className={BOTON_PRIMARIO}
            disabled={cargando || generarDeshabilitado}
            onClick={onGenerar}
          >
            {cargando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Generar
          </button>
        </>
      )}
    </div>
  );
}
