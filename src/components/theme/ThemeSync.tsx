"use client";

import { useEffect } from "react";
import { applyPolariaTheme } from "@/lib/theme/theme";
import { useThemeStore } from "@/stores/theme.store";

/** Sincroniza el atributo data-theme con el store tras hidratar. */
export function ThemeSync() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    applyPolariaTheme(theme);
  }, [theme]);

  return null;
}
