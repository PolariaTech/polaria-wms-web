import { create } from "zustand";

/**
 * Overlays del shell que deben ocultar el launcher flotante de Mateo Support
 * (p. ej. Cypher de OV) para no tapar acciones como «Borrar».
 * `ovEditOpen`: modal editar/crear OV abierto → confirmar antes de ir a Mateo IA (REQ-149).
 */
type ShellOverlayState = {
  cypherOpen: boolean;
  setCypherOpen: (open: boolean) => void;
  ovEditOpen: boolean;
  setOvEditOpen: (open: boolean) => void;
};

export const useShellOverlayStore = create<ShellOverlayState>((set) => ({
  cypherOpen: false,
  setCypherOpen: (open) => set({ cypherOpen: open }),
  ovEditOpen: false,
  setOvEditOpen: (open) => set({ ovEditOpen: open }),
}));
