import { ASSIGNMENT_OPTIONS } from "../constants/assignment-options";
import type { AssignmentOptionId } from "../types/assignment.types";
import { CreationOptionCard } from "./CreationOptionCard";

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
          <CreationOptionCard
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
