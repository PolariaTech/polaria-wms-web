"use client";

import { useCallback } from "react";
import {
  activateCompradorAdmin,
  deactivateCompradorAdmin,
  type CompradorListRow,
} from "../services/compradores.service";

export type PendingToggle = {
  row: CompradorListRow;
  mode: "disable" | "enable";
};

export function useCompradoresListToggleHandler({
  codigoCuenta,
  pendingToggle,
  isToggling,
  setIsToggling,
  setToggleError,
  setPendingToggle,
  reload,
}: {
  codigoCuenta: string | null;
  pendingToggle: PendingToggle | null;
  isToggling: boolean;
  setIsToggling: (value: boolean) => void;
  setToggleError: (value: string | null) => void;
  setPendingToggle: (value: PendingToggle | null) => void;
  reload: () => Promise<void>;
}) {
  return useCallback(async () => {
    if (!codigoCuenta || !pendingToggle || isToggling) return;

    setIsToggling(true);
    setToggleError(null);
    try {
      if (pendingToggle.mode === "disable") {
        await deactivateCompradorAdmin({
          codigoCuenta,
          idComprador: pendingToggle.row.idComprador,
        });
      } else {
        await activateCompradorAdmin({
          codigoCuenta,
          idComprador: pendingToggle.row.idComprador,
        });
      }
      setPendingToggle(null);
      await reload();
    } catch {
      setToggleError(
        pendingToggle.mode === "disable"
          ? "No se pudo deshabilitar el cliente."
          : "No se pudo habilitar el cliente.",
      );
    } finally {
      setIsToggling(false);
    }
  }, [
    codigoCuenta,
    isToggling,
    pendingToggle,
    reload,
    setIsToggling,
    setPendingToggle,
    setToggleError,
  ]);
}