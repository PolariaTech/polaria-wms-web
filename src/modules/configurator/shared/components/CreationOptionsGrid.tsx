import { CREATION_OPTIONS } from "@/modules/configurator/shared/constants/creation-options";
import type { CreationOptionId } from "@/modules/configurator/shared/types/creation.types";
import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";

interface CreationOptionsGridProps {
  onOptionClick?: (optionId: CreationOptionId) => void;
}

export function CreationOptionsGrid({ onOptionClick }: CreationOptionsGridProps) {
  return (
    <section
      aria-label="Tipos de entidad a crear"
      className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:gap-5 sm:px-6 lg:grid-cols-3 lg:gap-6"
    >
      {CREATION_OPTIONS.map((option) => (
        <PolariaSelectionCard
          key={option.id}
          option={option}
          onClick={
            onOptionClick
              ? (optionId) => onOptionClick(optionId as CreationOptionId)
              : undefined
          }
        />
      ))}
    </section>
  );
}
