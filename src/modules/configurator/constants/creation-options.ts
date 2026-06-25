import { ExternalLink, UserPlus, Warehouse } from "lucide-react";
import { ROUTES } from "@/config/routes";
import type { CreationOption, CreationOptionId } from "../types/creation.types";

export const CREATION_TITLE = "Creación" as const;

export const CREATION_SUBTITLE =
  "Selecciona el tipo de entidad que deseas crear" as const;

export const CREATION_OPTIONS: CreationOption[] = [
  {
    id: "cuentas",
    title: "Cuentas",
    icon: UserPlus,
    href: ROUTES.configuratorCreationAccounts,
  },
  {
    id: "bodega-interna",
    title: "Bodega interna",
    icon: Warehouse,
  },
  {
    id: "bodega-externa",
    title: "Bodega externa",
    icon: ExternalLink,
  },
] as const;

export function getCreationOptionHref(optionId: CreationOptionId): string {
  const option = CREATION_OPTIONS.find((item) => item.id === optionId);
  if (!option?.href) {
    throw new Error(`Opción de creación sin ruta configurada: ${optionId}`);
  }

  return option.href;
}
