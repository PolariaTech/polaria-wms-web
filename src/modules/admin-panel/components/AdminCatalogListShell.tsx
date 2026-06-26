import type { ReactNode } from "react";

interface AdminCatalogListShellProps {
  sectionLabel: string;
  title: string;
  hint: string;
  children: ReactNode;
}

export function AdminCatalogListShell({
  sectionLabel,
  title,
  hint,
  children,
}: AdminCatalogListShellProps) {
  return (
    <main className="flex flex-1 flex-col justify-start gap-8 pt-8 pb-10 sm:gap-10 sm:pt-12 sm:pb-14 lg:gap-12 lg:pt-16 lg:pb-20">
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <p className="polaria-text-label text-polaria-teal">{sectionLabel}</p>
        <h1 className="polaria-text-display mt-2">{title}</h1>
        <p className="polaria-text-subtitle mt-3">{hint}</p>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
    </main>
  );
}
