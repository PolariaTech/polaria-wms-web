import { create } from "zustand";

/**
 * Overlays del shell que deben ocultar el launcher flotante de Mateo Support
 * (p. ej. Cypher de OV) para no tapar acciones como «Borrar».
 */
type ShellOverlayState = {
  cypherOpen: boolean;
  setCypherOpen: (open: boolean) => void;
};

export const useShellOverlayStore = create<ShellOverlayState>((set) => ({
  cypherOpen: false,
  setCypherOpen: (open) => set({ cypherOpen: open }),
}));
