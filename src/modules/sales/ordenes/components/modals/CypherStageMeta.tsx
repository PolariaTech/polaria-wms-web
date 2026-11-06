import type { ReactNode } from "react";

export function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-20 pt-0.5">
        {label}
      </span>
      <div className="min-w-0 break-words polaria-text-body-sm text-polaria-w">{children}</div>
    </>
  );
}

export function PendingStageBody() {
  return (
    <p className="rounded-xl border border-dashed border-polaria-w-08 px-5 py-4 polaria-text-body-sm text-polaria-w-50">
      Aún no ocurre
    </p>
  );
}
