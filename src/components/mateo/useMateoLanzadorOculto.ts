"use client";

import { useCallback, useEffect, useState } from "react";

export const CLAVE_MATEO_LANZADOR_OCULTO = "polaria.mateo.lanzadorOculto";

/**
 * Si la persona escondió el botón flotante de Mateo Soporte. Se recuerda en este navegador
 * (es una comodidad por persona, no un dato del negocio). Arranca visible y lee lo guardado al
 * montar, para que el servidor y el navegador dibujen lo mismo al hidratar.
 */
export function useMateoLanzadorOculto(): {
  oculto: boolean;
  alternar: () => boolean;
} {
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    try {
      setOculto(window.localStorage.getItem(CLAVE_MATEO_LANZADOR_OCULTO) === "1");
    } catch {
      // Sin almacenamiento (ventana privada, bloqueado): se queda visible.
    }
  }, []);

  /** Cambia el estado y devuelve el nuevo valor. */
  const alternar = useCallback(() => {
    const siguiente = !oculto;
    setOculto(siguiente);
    try {
      window.localStorage.setItem(CLAVE_MATEO_LANZADOR_OCULTO, siguiente ? "1" : "0");
    } catch {
      // La preferencia no se guarda, pero el cambio de esta sesión sí aplica.
    }
    return siguiente;
  }, [oculto]);

  return { oculto, alternar };
}
