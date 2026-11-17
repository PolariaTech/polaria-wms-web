"use client";

import { useEffect, useState } from "react";
import { leerCorreoAbierto, recordarCorreoAbierto } from "../utils/ultimo-correo-abierto";

/** La fila del correo que se abrió, para marcarla al volver a la lista. */
export function useUltimoCorreoAbierto() {
  const [abierto, setAbierto] = useState<string | null>(null);
  useEffect(() => setAbierto(leerCorreoAbierto()), []);

  const marcarAbierto = (id: string) => {
    recordarCorreoAbierto(id);
    setAbierto(id);
  };

  return { abierto, marcarAbierto };
}
