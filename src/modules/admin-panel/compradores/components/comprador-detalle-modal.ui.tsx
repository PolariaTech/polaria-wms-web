"use client";

import type { ReactNode } from "react";
import { displayAltaValue } from "../utils/comprador-alta";

export function CaptureSection({
  title,
  optional,
  children,
}: {
  title: string;
  optional?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <h3 className="flex items-center justify-between gap-3 border-b border-polaria-w-08 px-4 py-2.5 polaria-text-label uppercase tracking-wide text-polaria-teal">
        <span>{title}</span>
        {optional ? (
          <span className="normal-case tracking-normal text-polaria-w-50">
            {optional}
          </span>
        ) : null}
      </h3>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function MetaField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="polaria-text-label text-polaria-w-20">{label}</p>
      <div className="mt-1 break-words polaria-text-body-sm font-medium text-polaria-w">
        {children}
      </div>
    </div>
  );
}

export function TextValue({ value }: { value: string | boolean | undefined }) {
  return <>{displayAltaValue(value)}</>;
}
