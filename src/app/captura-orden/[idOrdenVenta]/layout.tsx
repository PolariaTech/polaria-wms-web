import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Captura de surtido · Polaria",
  robots: { index: false, follow: false },
};

export default function CapturaOrdenLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
