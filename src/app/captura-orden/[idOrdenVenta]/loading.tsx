import { AuthLoadingSpinner } from "@/components/layouts/auth/AuthStatusCard";

export default function CapturaOrdenLoading() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-polaria-bg px-4 py-10">
      <div
        aria-hidden
        className="polaria-aurora pointer-events-none absolute inset-0"
      />
      <main className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-8 text-center polaria-card-glow">
          <h1 className="polaria-text-h3 text-polaria-w">Cargando</h1>
          <div className="mt-6">
            <AuthLoadingSpinner />
          </div>
        </div>
      </main>
    </div>
  );
}
