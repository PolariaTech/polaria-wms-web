import { CREATION_OPTIONS } from "@/modules/configurator/shared/constants/creation-options";
import type { CreationOptionId } from "@/modules/configurator/shared/types/creation.types";
import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";
import { PolariaSelectionGrid } from "@/components/shared/cards/PolariaSelectionGrid";

interface CreationOptionsGridProps {
  onOptionClick?: (optionId: CreationOptionId) => void;
}

export function CreationOptionsGrid({ onOptionClick }: CreationOptionsGridProps) {
  return (
    <PolariaSelectionGrid aria-label="Tipos de entidad a crear">
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
    </PolariaSelectionGrid>
  );
}
