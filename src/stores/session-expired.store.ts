import { create } from "zustand";

interface SessionExpiredState {
  /** `true` mientras el modal de sesión expirada está bloqueando la pantalla. */
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Estado del modal bloqueante que aparece cuando el token ya no sirve. */
export const useSessionExpiredStore = create<SessionExpiredState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
