import { create } from "zustand";
import type { CypherWidthMode } from "@/modules/sales/ordenes/constants/cypher-layout";
import {
  cycleCypherWidthMode,
  readCypherWidthMode,
  writeCypherWidthMode,
} from "@/modules/sales/ordenes/constants/cypher-layout";

/**
 * Overlays del shell que deben ocultar el launcher flotante de Mateo Support
 * (p. ej. Cypher de OV) para no tapar acciones como «Borrar».
 * `ovEditOpen`: modal editar/crear OV abierto → confirmar antes de ir a Mateo IA (REQ-149).
 * `cypherWidthMode`: REQ-150 achicar/agrandar panel Cypher.
 */
type ShellOverlayState = {
  cypherOpen: boolean;
  setCypherOpen: (open: boolean) => void;
  ovEditOpen: boolean;
  setOvEditOpen: (open: boolean) => void;
  cypherWidthMode: CypherWidthMode;
  setCypherWidthMode: (mode: CypherWidthMode) => void;
  nudgeCypherWidth: (direction: -1 | 1) => void;
};

export const useShellOverlayStore = create<ShellOverlayState>((set, get) => ({
  cypherOpen: false,
  setCypherOpen: (open) => set({ cypherOpen: open }),
  ovEditOpen: false,
  setOvEditOpen: (open) => set({ ovEditOpen: open }),
  cypherWidthMode: "normal",
  setCypherWidthMode: (mode) => {
    writeCypherWidthMode(mode);
    set({ cypherWidthMode: mode });
  },
  nudgeCypherWidth: (direction) => {
    const next = cycleCypherWidthMode(get().cypherWidthMode, direction);
    writeCypherWidthMode(next);
    set({ cypherWidthMode: next });
  },
}));

/** Hidratar preferencia de ancho Cypher en el cliente. */
export function hydrateCypherWidthModeFromStorage(): void {
  useShellOverlayStore.getState().setCypherWidthMode(readCypherWidthMode());
}
