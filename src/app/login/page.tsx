"use client";

import { AuthLayout } from "@/components/layouts/auth/AuthLayout";
import { LoginFlow } from "@/components/auth/login/LoginFlow";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginFlow />
    </AuthLayout>
  );
}
