import { Users } from "lucide-react";
import { ROUTES } from "@/config/routes";
import type { AssignmentOption, AssignmentOptionId } from "@/modules/configurator/shared/types/assignment.types";

export const ASSIGNMENT_TITLE = "Creación y asignación" as const;

export const ASSIGNMENT_SUBTITLE =
  "Selecciona el tipo de recurso que deseas gestionar" as const;

export const ASSIGNMENT_OPTIONS: AssignmentOption[] = [
  {
    id: "usuarios",
    title: "Usuarios",
    icon: Users,
    href: ROUTES.configuratorAssignmentUsers,
  },
] as const;

export function getAssignmentOptionHref(optionId: AssignmentOptionId): string {
  const option = ASSIGNMENT_OPTIONS.find((item) => item.id === optionId);
  if (!option?.href) {
    throw new Error(`Opción de asignación sin ruta configurada: ${optionId}`);
  }

  return option.href;
}
