import { CREATION_OPTIONS } from "../constants/creation-options";
import type { CreationOptionId } from "../types/creation.types";
import { CreationOptionCard } from "./CreationOptionCard";

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
        <CreationOptionCard
          key={option.id}
          option={option}
          onClick={onOptionClick}
        />
      ))}
    </section>
  );
}
