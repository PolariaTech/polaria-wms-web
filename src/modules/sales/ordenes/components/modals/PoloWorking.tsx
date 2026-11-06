import { cn } from "@/lib/utils/cn";

/**
 * Escena «Polo is working» de la marca (variante con planta), aprobada el 2026-10-23.
 * Fuente de verdad: D:\WORK\POLARIA\POLARIA_MARCA\marca\ilustraciones\escenas\
 * polaria-polo-working-planta-animado.svg (SHA-256 d46a05df9814bd6daab7484dc647e735987921a6d67adf7f449f48fc9335642a).
 * Se pinta como <img> para aislar sus ids y su CSS del documento; el reposo con
 * `prefers-reduced-motion` ya viene dentro del propio SVG. La marca pide no usarla por
 * debajo de ~64 px: aquí va a 224 px.
 */
const POLO_WORKING_PLANTA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 200"><style>@keyframes respira{0%,to{transform:translateY(0)}50%{transform:translateY(-1.92px)}}@keyframes lee{0%,12%,to{transform:translateX(0)}30%,42%{transform:translateX(-2.7px)}60%,72%{transform:translateX(2.7px)}}@keyframes mece{0%,to{transform:rotate(0)}25%{transform:rotate(1.6deg)}75%{transform:rotate(-1.6deg)}}#polo{animation:respira 2.6s ease-in-out infinite}#ojos{animation:lee 4s ease-in-out infinite}#hojas{transform-origin:52px 161px;animation:mece 4.4s ease-in-out infinite}@media (prefers-reduced-motion:reduce){#hojas,#ojos,#polo{animation:none}}</style><rect id="baldosa" width="270" height="200" fill="#020609" rx="44"/><g id="planta"><g id="hojas"><path fill="none" stroke="#f8f8f6" stroke-linecap="round" stroke-width="3" d="M52 161v-14"/><ellipse cx="44" cy="147" fill="#00e5cc" rx="5" ry="11" transform="rotate(-35 44 147)"/><ellipse cx="60" cy="147" fill="#00a591" rx="5" ry="11" transform="rotate(35 60 147)"/><ellipse cx="52" cy="141" fill="#00e5cc" rx="5" ry="12"/></g><path id="maceta" fill="#f8f8f6" d="M40 161h24l-3 14q-.5 2-2.5 2h-13q-2 0-2.5-2z"/></g><g transform="translate(50)"><g transform="matrix(1.3 0 0 1.3 20 20)"><g id="polo"><g id="cuerpo" fill="#00e5cc" stroke="#00e5cc" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="25" stroke="none"/><g id="lobulos" stroke-width="15"><g><line x1="50" x2="50" y1="50" y2="14"/></g><g transform="rotate(60 50 50)"><line x1="50" x2="50" y1="50" y2="14"/></g><g transform="rotate(120 50 50)"><line x1="50" x2="50" y1="50" y2="14"/></g><g transform="rotate(180 50 50)"><line x1="50" x2="50" y1="50" y2="14"/></g><g transform="rotate(240 50 50)"><line x1="50" x2="50" y1="50" y2="14"/></g><g transform="rotate(300 50 50)"><line x1="50" x2="50" y1="50" y2="14"/></g></g><g id="puntos" stroke="none"><g transform="rotate(30 50 50)"><circle cx="50" cy="16" r="4"/></g><g transform="rotate(90 50 50)"><circle cx="50" cy="16" r="4"/></g><g transform="rotate(150 50 50)"><circle cx="50" cy="16" r="4"/></g><g transform="rotate(210 50 50)"><circle cx="50" cy="16" r="4"/></g><g transform="rotate(270 50 50)"><circle cx="50" cy="16" r="4"/></g><g transform="rotate(330 50 50)"><circle cx="50" cy="16" r="4"/></g></g></g><g transform="translate(0 3)"><g id="ojos" fill="#020609"><path id="ojo-izq" d="M35.3 48.2h10.4a5.5 5.5 0 1 1-10.4 0"/><path id="ojo-der" d="M54.3 48.2h10.4a5.5 5.5 0 1 1-10.4 0"/></g></g></g></g><g id="laptop"><rect id="tapa" width="110" height="62" x="30" y="108" fill="#f8f8f6" rx="3"/><g id="logo-tapa" fill="#020609" stroke="#020609" stroke-linecap="round" transform="matrix(.34 0 0 .34 68.5 122.5)"><circle cx="50" cy="50" r="25" stroke="none"/><g stroke-width="15"><line x1="50" x2="50" y1="50" y2="14"/><line x1="50" x2="50" y1="50" y2="14" transform="rotate(60 50 50)"/><line x1="50" x2="50" y1="50" y2="14" transform="rotate(120 50 50)"/><line x1="50" x2="50" y1="50" y2="14" transform="rotate(180 50 50)"/><line x1="50" x2="50" y1="50" y2="14" transform="rotate(240 50 50)"/><line x1="50" x2="50" y1="50" y2="14" transform="rotate(300 50 50)"/></g><g stroke="none"><circle cx="50" cy="16" r="4" transform="rotate(30 50 50)"/><circle cx="50" cy="16" r="4" transform="rotate(90 50 50)"/><circle cx="50" cy="16" r="4" transform="rotate(150 50 50)"/><circle cx="50" cy="16" r="4" transform="rotate(210 50 50)"/><circle cx="50" cy="16" r="4" transform="rotate(270 50 50)"/><circle cx="50" cy="16" r="4" transform="rotate(330 50 50)"/></g></g><rect id="base" width="126" height="4" x="22" y="173" fill="#f8f8f6" rx="2"/></g><g id="taza"><rect id="taza-cuerpo" width="20" height="24" x="156" y="153" fill="#f8f8f6" rx="5"/><path id="taza-asa" fill="none" stroke="#f8f8f6" stroke-linecap="round" stroke-width="4" d="M176 159h3a6 6 0 0 1 0 12h-3"/></g></g><line id="escritorio" x1="20" x2="250" y1="181" y2="181" stroke="#f8f8f6" stroke-linecap="round" stroke-width="4"/></svg>`;
/**
 * Se pinta SIN la baldosa de fondo (`#baldosa`, el rectángulo casi negro de la escena): la
 * carga vive sobre su propia tarjeta oscura y la baldosa se vería como una caja dentro de
 * otra. Lo demás de la escena queda idéntico.
 */
const POLO_WORKING_PLANTA_SIN_BALDOSA = POLO_WORKING_PLANTA_SVG.replace(
  /<rect id="baldosa"[^>]*\/>/,
  "",
);
const POLO_WORKING_PLANTA_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  POLO_WORKING_PLANTA_SIN_BALDOSA,
)}`;
/** Tema claro: la escena original, con su baldosa oscura, para que lo blanco (laptop, mesa) se lea. */
const POLO_WORKING_PLANTA_CON_BALDOSA_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  POLO_WORKING_PLANTA_SVG,
)}`;

/** Polo trabajando en su laptop; decorativo, el estado lo dice el texto de al lado. */
export function PoloWorking({ className }: { className?: string }) {
  const comun = cn("h-auto w-56 max-w-full select-none lg:w-64", className);
  return (
    <>
      {/* Tema oscuro: sin baldosa, la tarjeta ya es oscura. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG animado con su CSS propio; next/image lo aplanaría */}
      <img
        src={POLO_WORKING_PLANTA_SRC}
        alt=""
        width={224}
        height={166}
        decoding="async"
        className={cn(comun, '[html[data-theme="light"]_&]:hidden')}
        draggable={false}
      />
      {/* Tema claro: con su baldosa oscura. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG animado con su CSS propio; next/image lo aplanaría */}
      <img
        src={POLO_WORKING_PLANTA_CON_BALDOSA_SRC}
        alt=""
        width={224}
        height={166}
        decoding="async"
        className={cn(comun, 'hidden [html[data-theme="light"]_&]:block')}
        draggable={false}
      />
    </>
  );
}
