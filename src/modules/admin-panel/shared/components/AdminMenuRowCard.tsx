import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AdminMenuOption } from "@/modules/admin-panel/shared/types/admin-assignment-creation.types";

interface AdminMenuRowCardProps {
  option: AdminMenuOption;
  onClick?: (optionId: AdminMenuOption["id"]) => void;
}

export function AdminMenuRowCard({ option, onClick }: AdminMenuRowCardProps) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={() => onClick?.(option.id)}
      className={cn(
        "group flex w-full items-center gap-3.5 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5",
        "transition duration-200 hover:border-polaria-teal hover:bg-polaria-t-20 hover:shadow-[0_0_16px_var(--teal-glow)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-polaria-w-08 bg-polaria-w-08",
          "transition group-hover:border-polaria-t-20 group-hover:bg-polaria-t-08",
        )}
      >
        <Icon
          className="h-[1.125rem] w-[1.125rem] text-polaria-teal"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>

      <span className="polaria-text-body-sm flex-1 text-left font-medium text-polaria-w">
        {option.title}
      </span>

      <ArrowRight
        className="h-[1.125rem] w-[1.125rem] shrink-0 text-polaria-w-20 transition group-hover:text-polaria-teal"
        strokeWidth={1.5}
        aria-hidden
      />
    </button>
  );
}
