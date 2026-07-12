import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthSessionBootstrap } from "@/components/auth/session/AuthSessionBootstrap";
import { AuthSessionScript } from "@/components/auth/session/AuthSessionScript";
import { AuthProvider } from "@/providers/auth/AuthProvider";
import { PolariaToastProvider } from "@/components/shared/toast/PolariaToastProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polaria WMS",
  description: "Sistema de gestión de almacenes Polaria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthSessionScript />
        <AuthProvider>
          <PolariaToastProvider>
            <AuthSessionBootstrap />
            {children}
          </PolariaToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
