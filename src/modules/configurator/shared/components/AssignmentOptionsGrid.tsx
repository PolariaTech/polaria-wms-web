import { ASSIGNMENT_OPTIONS } from "@/modules/configurator/shared/constants/assignment-options";
import type { AssignmentOptionId } from "@/modules/configurator/shared/types/assignment.types";
import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";

interface AssignmentOptionsGridProps {
  onOptionClick?: (optionId: AssignmentOptionId) => void;
}

export function AssignmentOptionsGrid({
  onOptionClick,
}: AssignmentOptionsGridProps) {
  return (
    <section
      aria-label="Opciones de creación y asignación"
      className="mx-auto flex w-full max-w-5xl justify-center px-4 sm:px-6"
    >
      {ASSIGNMENT_OPTIONS.map((option) => (
        <div key={option.id} className="w-full max-w-xs sm:max-w-sm">
          <PolariaSelectionCard
            option={option}
            onClick={(optionId) =>
              onOptionClick?.(optionId as AssignmentOptionId)
            }
          />
        </div>
      ))}
    </section>
  );
}
