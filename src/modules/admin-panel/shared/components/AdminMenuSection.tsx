import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";
import { PolariaSelectionGrid } from "@/components/shared/cards/PolariaSelectionGrid";
import type { AdminMenuOption } from "@/modules/admin-panel/shared/types/admin-assignment-creation.types";

interface AdminMenuSectionProps {
  title: string;
  options: readonly AdminMenuOption[];
  onOptionClick?: (optionId: AdminMenuOption["id"]) => void;
}

export function AdminMenuSection({
  title,
  options,
  onOptionClick,
}: AdminMenuSectionProps) {
  return (
    <section aria-label={title} className="w-full">
      <h2 className="polaria-text-body-sm mb-4 text-center font-semibold text-polaria-w-50">
        {title}
      </h2>
      <PolariaSelectionGrid
        aria-label={title}
        className="gap-3 px-0 sm:gap-3.5 sm:px-0 lg:gap-4"
      >
        {options.map((option) => (
          <PolariaSelectionCard
            key={option.id}
            size="sm"
            option={{
              id: option.id,
              title: option.title,
              icon: option.icon,
            }}
            onClick={(optionId) =>
              onOptionClick?.(optionId as AdminMenuOption["id"])
            }
          />
        ))}
      </PolariaSelectionGrid>
    </section>
  );
}
