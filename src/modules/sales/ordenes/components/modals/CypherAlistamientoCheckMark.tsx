import { Check } from "lucide-react";

export function CypherAlistamientoCheckMark({ ok }: { ok: boolean }) {
  if (!ok) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-polaria-w-20 text-polaria-w-20">
        —
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded border border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
      aria-label="Marcado"
    >
      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
    </span>
  );
}