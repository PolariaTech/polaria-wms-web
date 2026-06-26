"use client";

import {
  ADMIN_ASSIGNMENT_CREATION_SUBTITLE,
  ADMIN_ASSIGNMENT_CREATION_TITLE,
  ADMIN_ASSIGNMENT_OPTIONS,
  ADMIN_ASSIGNMENT_SECTION_TITLE,
  ADMIN_CREATION_OPTIONS,
  ADMIN_CREATION_SECTION_TITLE,
} from "../constants/admin-assignment-creation-options";
import type {
  AdminAssignmentCreationPanelProps,
  AdminAssignmentOptionId,
  AdminCreationOptionId,
} from "../types/admin-assignment-creation.types";
import { AdminMenuSection } from "./AdminMenuSection";

export function AdminAssignmentCreationPanel({
  onCreationOptionClick,
  onAssignmentOptionClick,
}: AdminAssignmentCreationPanelProps) {
  return (
    <main className="flex flex-1 flex-col justify-start gap-6 pt-6 pb-10 sm:gap-8 sm:pt-8 sm:pb-12">
      <section className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h1 className="polaria-text-display">{ADMIN_ASSIGNMENT_CREATION_TITLE}</h1>
        <p className="polaria-text-subtitle mt-3">
          {ADMIN_ASSIGNMENT_CREATION_SUBTITLE}
        </p>
      </section>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 sm:px-6">
        <AdminMenuSection
          title={ADMIN_CREATION_SECTION_TITLE}
          options={ADMIN_CREATION_OPTIONS}
          onOptionClick={(optionId) =>
            onCreationOptionClick?.(optionId as AdminCreationOptionId)
          }
        />

        <div
          aria-hidden
          className="h-px w-full bg-polaria-w-08"
        />

        <AdminMenuSection
          title={ADMIN_ASSIGNMENT_SECTION_TITLE}
          options={ADMIN_ASSIGNMENT_OPTIONS}
          onOptionClick={(optionId) =>
            onAssignmentOptionClick?.(optionId as AdminAssignmentOptionId)
          }
        />
      </div>
    </main>
  );
}

interface AdminAssignmentCreationPanelConnectedProps {
  onCreationOptionClick?: (optionId: AdminCreationOptionId) => void;
  onAssignmentOptionClick?: (optionId: AdminAssignmentOptionId) => void;
}

export function AdminAssignmentCreationPanelConnected({
  onCreationOptionClick,
  onAssignmentOptionClick,
}: AdminAssignmentCreationPanelConnectedProps) {
  return (
    <AdminAssignmentCreationPanel
      onCreationOptionClick={onCreationOptionClick}
      onAssignmentOptionClick={onAssignmentOptionClick}
    />
  );
}
