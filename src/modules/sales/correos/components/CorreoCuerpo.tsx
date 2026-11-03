"use client";

import { useMemo, useState } from "react";
import {
  armarDocumentoDelCorreo,
  tieneImagenesExternas,
} from "../utils/correos-formato";
import { BOTON_SECUNDARIO } from "./AccionIngreso";

function AvisoDeImagenes({ onMostrar }: { onMostrar: () => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-polaria-w-08 px-4 py-3">
      <p className="polaria-text-body-sm text-polaria-w-50">
        Se bloquearon las imágenes de internet: al cargarlas, quien envió el correo sabría que
        se abrió.
      </p>
      <button type="button" onClick={onMostrar} className={BOTON_SECUNDARIO}>
        Mostrar imágenes
      </button>
    </div>
  );
}

/**
 * El mensaje del correo, dentro de un marco aislado: sin scripts, sin formularios, sin acceso a
 * esta página y con las imágenes de internet bloqueadas hasta que se pidan. El cuerpo de un
 * correo es contenido ajeno, nunca se inserta directo en la pantalla.
 */
export function CorreoCuerpo({
  html,
  texto,
  onCargado,
}: {
  html: string;
  texto: string;
  /** Avisa que el marco terminó de dibujar el mensaje. */
  onCargado?: () => void;
}) {
  const [permitirImagenes, setPermitirImagenes] = useState(false);
  const documento = useMemo(
    () => armarDocumentoDelCorreo({ html, texto, permitirImagenes }),
    [html, texto, permitirImagenes],
  );
  const hayImagenesBloqueadas = !permitirImagenes && tieneImagenesExternas(html);

  return (
    <section>
      <h3 className="polaria-text-body font-semibold">Mensaje</h3>
      {hayImagenesBloqueadas ? (
        <AvisoDeImagenes onMostrar={() => setPermitirImagenes(true)} />
      ) : null}
      <iframe
        title="Cuerpo del correo"
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        srcDoc={documento}
        onLoad={onCargado}
        className="mt-3 h-[70vh] min-h-96 w-full rounded-xl border border-polaria-w-08 bg-white"
      />
    </section>
  );
}
