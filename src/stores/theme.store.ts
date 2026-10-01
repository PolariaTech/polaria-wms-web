"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  applyPolariaTheme,
  POLARIA_THEME_DEFAULT,
  POLARIA_THEME_STORAGE_KEY,
  type PolariaTheme,
} from "@/lib/theme/theme";

interface ThemeState {
  theme: PolariaTheme;
  setTheme: (theme: PolariaTheme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: POLARIA_THEME_DEFAULT,
      setTheme: (theme) => {
        applyPolariaTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next: PolariaTheme =
          get().theme === "dark" ? "light" : "dark";
        applyPolariaTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: POLARIA_THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyPolariaTheme(state.theme);
      },
    },
  ),
);
