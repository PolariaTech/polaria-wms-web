import { cn } from "@/lib/cn";
import type { ConfiguratorAction } from "../types/configurator.types";

interface ConfiguratorActionCardProps {
  action: ConfiguratorAction;
  onClick?: (actionId: ConfiguratorAction["id"]) => void;
  featured?: boolean;
}

export function ConfiguratorActionCard({
  action,
  onClick,
  featured = false,
}: ConfiguratorActionCardProps) {
  const Icon = action.icon;

  return (
    <button
      type="button"
      onClick={() => onClick?.(action.id)}
      className={cn(
        "group flex w-full flex-col items-center rounded-2xl border bg-polaria-t-08 text-center backdrop-blur-sm transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        featured
          ? "border-polaria-teal p-8 shadow-[0_0_32px_var(--teal-glow)] hover:bg-polaria-t-20 sm:flex-row sm:items-center sm:gap-6 sm:p-8 sm:text-left"
          : "border-polaria-t-20 p-8 hover:border-polaria-teal hover:bg-polaria-t-20 hover:shadow-[0_0_32px_var(--teal-glow)]",
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-xl border border-polaria-w-08 bg-polaria-w-08 transition",
          "group-hover:border-polaria-t-20 group-hover:bg-polaria-t-08",
          featured ? "mb-5 sm:mb-0" : "mb-5",
        )}
      >
        <Icon
          className={cn(
            "h-6 w-6 transition",
            featured
              ? "text-polaria-teal"
              : "text-polaria-w-50 group-hover:text-polaria-teal",
          )}
          strokeWidth={1.5}
          aria-hidden
        />
      </div>

      <div className={featured ? "sm:flex-1" : undefined}>
        <h2
          className={cn(
            "polaria-text-card-title",
            featured && "text-polaria-teal",
          )}
        >
          {action.title}
        </h2>
        <p className="polaria-text-subtitle mt-2">{action.description}</p>
      </div>
    </button>
  );
}
