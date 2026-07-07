import Image from "next/image";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-polaria-bg px-4 py-10">
      <div
        aria-hidden
        className="polaria-aurora pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-polaria-t-20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-polaria-t-08"
      />

      <header className="relative z-10 mb-8 flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Polaria"
          width={240}
          height={64}
          priority
          className="h-auto w-44 sm:w-52"
        />
        <p className="mt-3 text-sm text-polaria-w-50">
          Sistema de autenticación seguro
        </p>
      </header>

      <main className="relative z-10 w-full max-w-md">{children}</main>

      <footer className="relative z-10 mt-10 text-center text-xs text-polaria-w-20">
        Sistema seguro de autenticación empresarial
      </footer>
    </div>
  );
}
