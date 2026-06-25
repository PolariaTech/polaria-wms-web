import { cn } from "@/lib/cn";
import type { CreationOption } from "../types/creation.types";

interface CreationOptionCardProps {
  option: CreationOption;
  onClick?: (optionId: CreationOption["id"]) => void;
}

export function CreationOptionCard({ option, onClick }: CreationOptionCardProps) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={() => onClick?.(option.id)}
      className={cn(
        "group flex w-full flex-col items-center rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-8 text-center backdrop-blur-sm",
        "transition duration-200 hover:border-polaria-teal hover:bg-polaria-t-20 hover:shadow-[0_0_32px_var(--teal-glow)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
      )}
    >
      <div
        className={cn(
          "mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-polaria-w-08 bg-polaria-w-08",
          "transition group-hover:border-polaria-t-20 group-hover:bg-polaria-t-08",
        )}
      >
        <Icon
          className="h-6 w-6 text-polaria-w-50 transition group-hover:text-polaria-teal"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>

      <h2 className="polaria-text-card-title">{option.title}</h2>
    </button>
  );
}
