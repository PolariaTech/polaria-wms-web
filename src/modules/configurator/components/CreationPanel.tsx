"use client";

import {
  CREATION_SUBTITLE,
  CREATION_TITLE,
} from "../constants/creation-options";
import type { CreationOptionId, CreationPanelProps } from "../types/creation.types";
import { CreationOptionsGrid } from "./CreationOptionsGrid";

export function CreationPanel({ onOptionClick }: CreationPanelProps) {
  return (
    <main className="flex flex-1 flex-col justify-start gap-8 pt-8 pb-10 sm:gap-10 sm:pt-12 sm:pb-14 lg:gap-12 lg:pt-16 lg:pb-20">
      <section className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h1 className="polaria-text-display">{CREATION_TITLE}</h1>
        <p className="polaria-text-subtitle mt-3">{CREATION_SUBTITLE}</p>
      </section>

      <CreationOptionsGrid onOptionClick={onOptionClick} />
    </main>
  );
}

interface CreationPanelConnectedProps {
  onOptionClick?: (optionId: CreationOptionId) => void;
}

export function CreationPanelConnected({
  onOptionClick,
}: CreationPanelConnectedProps) {
  return <CreationPanel onOptionClick={onOptionClick} />;
}
