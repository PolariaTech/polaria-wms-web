import { create } from "zustand";

/**
 * REQ-100 / REQ-177 / REQ-205: la fecha del topbar filtra las OV por fecha
 * de entrega de ese día y del día siguiente (hoy y mañana). Las que no tienen
 * fecha de entrega siguen visibles.
 * `dia` es `YYYY-MM-DD` del día en curso mientras el filtro está activo; null lo apaga.
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
