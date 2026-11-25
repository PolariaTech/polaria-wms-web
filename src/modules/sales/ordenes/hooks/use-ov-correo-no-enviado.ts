import { useCallback, useEffect, useMemo, useState } from "react";
import {
  VIGENCIA_MARCA_LOCAL_MS,
  mergeCorreoNoEnviado,
} from "../print/print-correo-fallo";

type MarcasLocales = {
  marcados: Map<string, number>;
  quitados: Map<string, number>;
};

/**
 * Marcas locales de «correo no enviado» con la hora en que se pusieron: pasada su
 * vigencia manda el servidor (REQ-189).
 */
export function useOvCorreoNoEnviado({
  idsServidor,
  reload,
}: {
  idsServidor: Set<string> | undefined;
  reload: () => Promise<unknown>;
}) {
  const [marcasLocales, setMarcasLocales] = useState<MarcasLocales>({
    marcados: new Map(),
    quitados: new Map(),
  });
  const [ahoraMarcas, setAhoraMarcas] = useState(() => Date.now());

  const marcarCorreoNoEnviado = useCallback((idOrdenVenta: string) => {
    setMarcasLocales((prev) => {
      const marcados = new Map(prev.marcados);
      const quitados = new Map(prev.quitados);
      marcados.set(idOrdenVenta, Date.now());
      quitados.delete(idOrdenVenta);
      return { marcados, quitados };
    });
  }, []);
  const quitarCorreoNoEnviado = useCallback((idOrdenVenta: string) => {
    setMarcasLocales((prev) => {
      const marcados = new Map(prev.marcados);
      const quitados = new Map(prev.quitados);
      marcados.delete(idOrdenVenta);
      quitados.set(idOrdenVenta, Date.now());
      return { marcados, quitados };
    });
  }, []);

  const idsCorreoServidor = useMemo(
    () => idsServidor ?? new Set<string>(),
    [idsServidor],
  );
  const idsCorreoNoEnviado = useMemo(
    () =>
      mergeCorreoNoEnviado({
        servidor: idsCorreoServidor,
        marcados: marcasLocales.marcados,
        quitados: marcasLocales.quitados,
        ahora: ahoraMarcas,
      }),
    [idsCorreoServidor, marcasLocales, ahoraMarcas],
  );

  // REQ-189: al vencer la marca local más próxima, se recarga la lista y se deja decidir al servidor.
  useEffect(() => {
    const vigentes = [
      ...marcasLocales.marcados.values(),
      ...marcasLocales.quitados.values(),
    ].filter((puestaEn) => ahoraMarcas - puestaEn < VIGENCIA_MARCA_LOCAL_MS);
    if (vigentes.length === 0) return;
    const vence = Math.min(...vigentes) + VIGENCIA_MARCA_LOCAL_MS;
    const timer = setTimeout(
      () => {
        void reload().finally(() => setAhoraMarcas(Date.now()));
      },
      Math.max(vence - Date.now(), 0) + 50,
    );
    return () => clearTimeout(timer);
  }, [marcasLocales, ahoraMarcas, reload]);

  return { idsCorreoNoEnviado, marcarCorreoNoEnviado, quitarCorreoNoEnviado };
}
