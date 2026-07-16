import type { MateoWidgetApi } from "./mateo-widget.types";

const SCRIPT_ID = "mateo-widget-script";

function resolveGlobalApi(): MateoWidgetApi | null {
  if (typeof window === "undefined") return null;
  return window.MateoWidget ?? window.__MateoWidget__ ?? null;
}

function isUsableApi(api: MateoWidgetApi | null): api is MateoWidgetApi {
  if (!api?.configureTokenFetcher) return false;
  return typeof api.mount === "function" || typeof api.init === "function";
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      if (isUsableApi(resolveGlobalApi())) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () =>
          reject(new Error("No se pudo cargar el script del widget Mateo.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("No se pudo cargar el script del widget Mateo."));
    document.head.appendChild(script);
  });
}

/**
 * Carga el bundle del widget desde CDN (`NEXT_PUBLIC_MATEO_WIDGET_SCRIPT_URL`).
 */
export async function loadMateoWidgetApi(
  scriptUrl?: string | null,
): Promise<MateoWidgetApi> {
  const fromWindow = resolveGlobalApi();
  if (isUsableApi(fromWindow)) {
    return fromWindow;
  }

  if (!scriptUrl) {
    throw new Error(
      "Widget Mateo no disponible: define NEXT_PUBLIC_MATEO_WIDGET_SCRIPT_URL.",
    );
  }

  await loadScript(scriptUrl);

  const afterScript = resolveGlobalApi();
  if (!isUsableApi(afterScript)) {
    throw new Error(
      "El script Mateo cargó pero no expone MateoWidget.configureTokenFetcher/mount|init.",
    );
  }

  return afterScript;
}
