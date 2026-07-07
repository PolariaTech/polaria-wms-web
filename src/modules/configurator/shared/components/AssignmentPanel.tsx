"use client";

import {
  ASSIGNMENT_SUBTITLE,
  ASSIGNMENT_TITLE,
} from "@/modules/configurator/shared/constants/assignment-options";
import type { AssignmentOptionId, AssignmentPanelProps } from "@/modules/configurator/shared/types/assignment.types";
import { AssignmentOptionsGrid } from "@/modules/configurator/shared/components/AssignmentOptionsGrid";

export function AssignmentPanel({ onOptionClick }: AssignmentPanelProps) {
  return (
    <main className="flex flex-1 flex-col justify-start gap-8 pt-8 pb-10 sm:gap-10 sm:pt-12 sm:pb-14 lg:gap-12 lg:pt-16 lg:pb-20">
      <section className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h1 className="polaria-text-display">{ASSIGNMENT_TITLE}</h1>
        <p className="polaria-text-subtitle mt-3">{ASSIGNMENT_SUBTITLE}</p>
      </section>

      <AssignmentOptionsGrid onOptionClick={onOptionClick} />
    </main>
  );
}

interface AssignmentPanelConnectedProps {
  onOptionClick?: (optionId: AssignmentOptionId) => void;
}

export function AssignmentPanelConnected({
  onOptionClick,
}: AssignmentPanelConnectedProps) {
  return <AssignmentPanel onOptionClick={onOptionClick} />;
}
