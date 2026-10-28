import { create } from "zustand";

/**
 * REQ-100 / REQ-177: la fecha del topbar filtra las OV por fecha de entrega
 * de ese día (las que no tienen fecha de entrega siguen visibles).
 * `dia` es `YYYY-MM-DD` mientras el filtro está activo; null lo apaga.
 */
type OvFechaFiltroState = {
  dia: string | null;
  toggle: (dia: string) => void;
  clear: () => void;
};

export const useOvFechaFiltroStore = create<OvFechaFiltroState>((set) => ({
  dia: null,
  toggle: (dia) =>
    set((state) => ({ dia: state.dia ? null : dia })),
  clear: () => set({ dia: null }),
}));
