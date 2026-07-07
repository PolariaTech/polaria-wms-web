import type { AuthScope } from "@/types/auth/auth";
import { cn } from "@/lib/utils/cn";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  scope: AuthScope;
  futureActions: readonly string[];
  className?: string;
}

export function ModulePlaceholder({
  title,
  description,
  scope,
  futureActions,
  className,
}: ModulePlaceholderProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12",
        className,
      )}
    >
      <header className="text-center">
        <span className="polaria-text-badge inline-flex rounded-full border border-polaria-t-20 bg-polaria-t-08 px-3 py-1 text-polaria-teal">
          scope: {scope}
        </span>
        <h1 className="polaria-text-display mt-4">{title}</h1>
        <p className="polaria-text-subtitle mt-3">{description}</p>
      </header>

      <section
        aria-label="Acciones planificadas"
        className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-6 backdrop-blur-sm"
      >
        <h2 className="polaria-text-card-title">Próximamente</h2>
        <p className="polaria-text-body-sm mt-2 text-polaria-w-50">
          Funcionalidades previstas en esta sección:
        </p>
        <ul className="mt-4 space-y-2">
          {futureActions.map((action) => (
            <li
              key={action}
              className="polaria-text-body-sm flex items-center gap-2 text-polaria-w-50"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-polaria-teal"
              />
              {action}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
