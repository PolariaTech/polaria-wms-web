import Script from "next/script";
import { POLARIA_THEME_STORAGE_KEY } from "@/lib/theme/theme";

/**
 * Aplica data-theme antes del primer paint para evitar flash.
 */
export function ThemeBootScript() {
  const script = `(function(){try{var k=${JSON.stringify(
    POLARIA_THEME_STORAGE_KEY,
  )};var raw=localStorage.getItem(k);var t="dark";if(raw){var p=JSON.parse(raw);if(p&&p.state&&(p.state.theme==="light"||p.state.theme==="dark"))t=p.state.theme;}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

  return (
    <Script id="polaria-theme-boot" strategy="beforeInteractive">
      {script}
    </Script>
  );
}
