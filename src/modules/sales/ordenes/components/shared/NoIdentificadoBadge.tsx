import { cn } from "@/lib/utils/cn";

/** Chip compacto cuando Mateo no enlazó producto/cliente al catálogo. */
export function NoIdentificadoBadge({
  className,
  label = "sin ID",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-1 py-px",
        "border border-polaria-warning-border bg-polaria-warning-bg",
        "text-[0.65rem] font-bold uppercase leading-tight tracking-wide text-polaria-warning",
        className,
      )}
    >
      {label}
    </span>
  );
}
