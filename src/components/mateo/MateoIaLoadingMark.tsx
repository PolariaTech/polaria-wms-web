import { cn } from "@/lib/utils/cn";

type MateoIaLoadingMarkSize = "sm" | "md" | "lg" | "xl";
type MateoIaLoadingMarkTone = "teal" | "onTeal";

const SIZE_PX: Record<MateoIaLoadingMarkSize, number> = {
  sm: 18,
  md: 28,
  lg: 48,
  xl: 88,
};

/**
 * Marca animada de Mateo IA para estados de carga (lectura de pedido / envío).
 * `tone="onTeal"`: contraste oscuro sobre botones bg-polaria-teal.
 */
export function MateoIaLoadingMark({
  size = "md",
  tone = "teal",
  className,
  label = "Mateo IA",
  showLabel = false,
}: {
  size?: MateoIaLoadingMarkSize;
  tone?: MateoIaLoadingMarkTone;
  className?: string;
  label?: string;
  showLabel?: boolean;
}) {
  const px = SIZE_PX[size];
  const stroke = tone === "onTeal" ? "#020609" : "#00e5cc";
  const fill = tone === "onTeal" ? "rgba(2,6,9,0.12)" : "rgba(0,229,204,0.08)";
  const uid = `mateo-${size}-${tone}`;

  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span
        aria-hidden
        className="relative inline-flex shrink-0 items-center justify-center"
        style={{ width: px, height: px }}
      >
        <style>{`
          @keyframes ${uid}-orbit {
            to { transform: rotate(360deg); }
          }
          @keyframes ${uid}-pulse {
            0%, 100% { opacity: 0.4; transform: scale(0.92); }
            50% { opacity: 1; transform: scale(1.08); }
          }
          @keyframes ${uid}-core {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
          .${uid}-orbit {
            animation: ${uid}-orbit 1.05s linear infinite;
            transform-origin: 20px 20px;
          }
          .${uid}-pulse {
            animation: ${uid}-pulse 1.35s ease-in-out infinite;
            transform-origin: 20px 20px;
          }
          .${uid}-core {
            animation: ${uid}-core 1.35s ease-in-out infinite;
          }
        `}</style>
        <svg
          width={px}
          height={px}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <circle
            className={`${uid}-pulse`}
            cx="20"
            cy="20"
            r="17"
            stroke={stroke}
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          <circle
            className={`${uid}-orbit`}
            cx="20"
            cy="20"
            r="13.5"
            stroke={stroke}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeDasharray="20 65"
          />
          <circle
            className={`${uid}-core`}
            cx="20"
            cy="20"
            r="9"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.4"
          />
          <path
            className={`${uid}-core`}
            d="M12.5 26 V14.5 L17.2 22.2 L20 17.6 L22.8 22.2 L27.5 14.5 V26"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </span>
      {showLabel ? (
        <span
          className={cn(
            "polaria-text-caption font-semibold tracking-wide",
            tone === "onTeal" ? "text-polaria-on-teal" : "text-polaria-teal",
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
