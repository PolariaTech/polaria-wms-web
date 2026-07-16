import { ASSIGNMENT_OPTIONS } from "@/modules/configurator/shared/constants/assignment-options";
import type { AssignmentOptionId } from "@/modules/configurator/shared/types/assignment.types";
import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";
import { PolariaSelectionGrid } from "@/components/shared/cards/PolariaSelectionGrid";

interface AssignmentOptionsGridProps {
  onOptionClick?: (optionId: AssignmentOptionId) => void;
}

export function AssignmentOptionsGrid({
  onOptionClick,
}: AssignmentOptionsGridProps) {
  return (
    <PolariaSelectionGrid aria-label="Opciones de creación y asignación">
      {ASSIGNMENT_OPTIONS.map((option) => (
        <PolariaSelectionCard
          key={option.id}
          option={option}
          onClick={(optionId) =>
            onOptionClick?.(optionId as AssignmentOptionId)
          }
        />
      ))}
    </PolariaSelectionGrid>
  );
}
