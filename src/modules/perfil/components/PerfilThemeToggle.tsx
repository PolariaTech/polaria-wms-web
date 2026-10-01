"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useThemeStore } from "@/stores/theme.store";

export function PerfilThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const isDark = theme === "dark";

  return (
    <div className="space-y-3 border-t border-polaria-w-08 px-5 py-5 sm:px-6">
      <div>
        <p className="polaria-text-label">Configuración básica</p>
        <p className="mt-1 polaria-text-caption text-polaria-w-50">
          Apariencia de la aplicación en este dispositivo.
        </p>
      </div>

      <div
        role="group"
        aria-label="Tema de apariencia"
        className="grid grid-cols-2 gap-2 rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-1"
      >
        <button
          type="button"
          aria-pressed={isDark}
          onClick={() => setTheme("dark")}
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2",
            "polaria-text-body-sm font-medium transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
            isDark
              ? "bg-polaria-teal text-polaria-bg shadow-sm"
              : "text-polaria-w-50 hover:text-polaria-w",
          )}
        >
          <Moon className="h-4 w-4" aria-hidden strokeWidth={1.75} />
          Oscuro
        </button>
        <button
          type="button"
          aria-pressed={!isDark}
          onClick={() => setTheme("light")}
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2",
            "polaria-text-body-sm font-medium transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
            !isDark
              ? "bg-polaria-teal text-polaria-bg shadow-sm"
              : "text-polaria-w-50 hover:text-polaria-w",
          )}
        >
          <Sun className="h-4 w-4" aria-hidden strokeWidth={1.75} />
          Claro
        </button>
      </div>
    </div>
  );
}
