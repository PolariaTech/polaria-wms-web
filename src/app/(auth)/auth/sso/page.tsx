"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/layouts/auth/AuthLayout";
import { SsoFlow, SsoLoadingCard } from "@/components/auth/sso/SsoFlow";

export default function SsoPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<SsoLoadingCard />}>
        <SsoFlow />
      </Suspense>
    </AuthLayout>
  );
}
