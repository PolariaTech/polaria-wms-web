import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PolariaSelectionOption {
  id: string;
  title: string;
  icon: LucideIcon;
}

export type PolariaSelectionCardSize = "default" | "sm";

interface PolariaSelectionCardProps {
  option: PolariaSelectionOption;
  onClick?: (optionId: string) => void;
  size?: PolariaSelectionCardSize;
}

const SIZE_STYLES: Record<
  PolariaSelectionCardSize,
  {
    button: string;
    iconWrap: string;
    icon: string;
    title: string;
  }
> = {
  default: {
    button: "w-[min(100%,14rem)] rounded-2xl px-4 py-6",
    iconWrap: "mb-4 h-12 w-12 rounded-xl",
    icon: "h-6 w-6",
    title: "polaria-text-card-title",
  },
  sm: {
    button: "w-[min(100%,10.5rem)] rounded-xl px-3 py-4",
    iconWrap: "mb-3 h-10 w-10 rounded-lg",
    icon: "h-5 w-5",
    title: "polaria-text-body-sm font-semibold text-polaria-w",
  },
};

export function PolariaSelectionCard({
  option,
  onClick,
  size = "default",
}: PolariaSelectionCardProps) {
  const Icon = option.icon;
  const styles = SIZE_STYLES[size];

  return (
    <button
      type="button"
      onClick={() => onClick?.(option.id)}
      className={cn(
        "group flex aspect-square shrink-0 flex-col items-center justify-center border border-polaria-t-20 bg-polaria-t-08 text-center backdrop-blur-sm",
        "transition duration-200 hover:border-polaria-teal hover:bg-polaria-t-20 hover:shadow-[0_0_32px_var(--teal-glow)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        styles.button,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center border border-polaria-w-08 bg-polaria-w-08",
          "transition group-hover:border-polaria-t-20 group-hover:bg-polaria-t-08",
          styles.iconWrap,
        )}
      >
        <Icon
          className={cn(
            "text-polaria-w-50 transition group-hover:text-polaria-teal",
            styles.icon,
          )}
          strokeWidth={1.5}
          aria-hidden
        />
      </div>

      <h2 className={cn("px-1 leading-snug", styles.title)}>{option.title}</h2>
    </button>
  );
}
