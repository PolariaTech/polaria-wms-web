interface AuthStatusCardProps {
  title: string;
  message: string;
  children?: React.ReactNode;
}

/** Card de estado (carga / error) del layout de autenticación Polaria. */
export function AuthStatusCard({
  title,
  message,
  children,
}: AuthStatusCardProps) {
  return (
    <div className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-8 text-center polaria-card-glow">
      <h1 className="polaria-text-h3 text-polaria-w">{title}</h1>
      <p className="polaria-text-body mt-3 text-polaria-w-50">{message}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}

export function AuthLoadingSpinner() {
  return (
    <div
      aria-hidden
      className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-polaria-t-20 border-t-polaria-teal"
    />
  );
}
