import {
  AuthLoadingSpinner,
  AuthStatusCard,
} from "@/components/layouts/auth/AuthStatusCard";
import { cn } from "@/lib/utils/cn";

interface PolariaStatusLoadingProps {
  title?: string;
  message?: string;
  className?: string;
  /** Sin card ni borde: para tablas y paneles que ya tienen recuadro. */
  embedded?: boolean;
}

function LoadingCopy({ title, message }: { title: string; message: string }) {
  return (
    <>
      <h2 className="polaria-text-h3 text-polaria-w">{title}</h2>
      <p className="polaria-text-body mt-3 text-polaria-w-50">{message}</p>
      <div className="mt-6">
        <AuthLoadingSpinner />
      </div>
    </>
  );
}

/** Card de carga Polaria (la misma del QR / SSO Mateo). */
export function PolariaStatusLoading({
  title = "Cargando…",
  message = "Estamos preparando la información.",
  className,
  embedded = false,
}: PolariaStatusLoadingProps) {
  if (embedded) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex w-full flex-col items-center justify-center px-4 py-10 text-center",
          className,
        )}
      >
        <LoadingCopy title={title} message={message} />
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex w-full items-center justify-center px-4 py-8",
        className,
      )}
    >
      <div className="w-full max-w-md">
        <AuthStatusCard title={title} message={message}>
          <AuthLoadingSpinner />
        </AuthStatusCard>
      </div>
    </div>
  );
}
