"use client";

import { cn } from "@/lib/utils/cn";
import {
  initialsFromNombre,
  isOvEditLockStale,
} from "../../utils/pedido/ov-edit-lock";

type Props = {
  editLockedBy?: string | null;
  editLockedAt?: string | null;
  editLockedNombre?: string | null;
  viewerId?: string | null;
  className?: string;
};

/** Avatar de iniciales tipo Sheets cuando alguien edita la OV. */
export function OvEditPresenceBadge({
  editLockedBy,
  editLockedAt,
  editLockedNombre,
  viewerId,
  className,
}: Props) {
  const holder = editLockedBy?.trim() || "";
  if (!holder) return null;
  if (isOvEditLockStale(editLockedAt)) return null;

  const nombre = editLockedNombre?.trim() || "Alguien";
  const soyYo = Boolean(viewerId && holder === viewerId.trim());
  const label = soyYo ? "Tú estás editando" : `${nombre} está editando`;

  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
        "border border-polaria-t-20 bg-polaria-t-08 polaria-text-caption font-semibold text-polaria-teal",
        className,
      )}
      title={label}
      aria-label={label}
    >
      {initialsFromNombre(nombre)}
    </span>
  );
}
