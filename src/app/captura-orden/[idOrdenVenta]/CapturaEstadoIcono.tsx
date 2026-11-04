import type { EstadoRegistro } from "./captura-sesion";

interface CapturaEstadoIconoProps {
  estado: EstadoRegistro;
  /** `lg` para el estado de la hoja actual; `sm` para las filas de la lista. */
  tamano?: "lg" | "sm";
}

const TRAZO = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Cámara de los botones de captura (mismo trazo que el resto de iconos). */
export function IconoCamara() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="pointer-events-none h-6 w-6 shrink-0"
      strokeWidth={1.8}
      {...TRAZO}
    >
      <path d="M4.5 8.5h2.2l1.1-2h6.4l1.1 2H19.5A1.5 1.5 0 0 1 21 10v7.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5V10A1.5 1.5 0 0 1 4.5 8.5Z" />
      <circle cx="12" cy="13.5" r="3.1" />
    </svg>
  );
}

/** Flecha en círculo del botón «Reintentar». */
export function IconoReintentar() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="pointer-events-none h-6 w-6 shrink-0"
      strokeWidth={1.8}
      {...TRAZO}
    >
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20 4.5v4h-4" />
    </svg>
  );
}

/**
 * Estado de una foto con tres formas distintas, no solo tres colores:
 * flecha que sube (subiendo y procesando, las dos «en curso»), palomita sobre
 * fondo lleno (lista) y signo de exclamación (falló). Se entiende sin leer.
 */
export function CapturaEstadoIcono({
  estado,
  tamano = "lg",
}: CapturaEstadoIconoProps) {
  const grande = tamano === "lg";
  const caja = grande ? "h-20 w-20" : "h-8 w-8";
  const glifo = grande ? "h-10 w-10" : "h-4 w-4";
  const grosor = grande ? 2.2 : 2.6;

  if (estado === "lista") {
    return (
      <span
        aria-hidden
        className={`flex ${caja} shrink-0 items-center justify-center rounded-full bg-polaria-teal text-polaria-on-teal`}
      >
        <svg viewBox="0 0 24 24" className={glifo} strokeWidth={grosor + 0.4} {...TRAZO}>
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  if (estado === "fallo") {
    return (
      <span
        aria-hidden
        className={`flex ${caja} shrink-0 items-center justify-center rounded-full border-2 border-polaria-danger bg-polaria-danger-bg text-polaria-danger`}
      >
        <svg viewBox="0 0 24 24" className={glifo} strokeWidth={grosor} {...TRAZO}>
          <path d="M12 6.5v7" />
          <path d="M12 17.4v.1" />
        </svg>
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={`relative flex ${caja} shrink-0 items-center justify-center rounded-full border-2 border-polaria-t-20 bg-polaria-t-08 text-polaria-teal`}
    >
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-full w-full animate-spin motion-reduce:animate-none"
        style={{ animationDuration: "1.4s" }}
        strokeWidth={grande ? 2 : 2.4}
        {...TRAZO}
      >
        <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" />
      </svg>
      <svg viewBox="0 0 24 24" className={glifo} strokeWidth={grosor} {...TRAZO}>
        <path d="M12 17V7" />
        <path d="M7.5 11.5L12 7l4.5 4.5" />
      </svg>
    </span>
  );
}
