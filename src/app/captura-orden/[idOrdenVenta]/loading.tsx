import { AuthLayout } from "@/components/layouts/auth/AuthLayout";
import {
  AuthLoadingSpinner,
  AuthStatusCard,
} from "@/components/layouts/auth/AuthStatusCard";

export default function CapturaOrdenLoading() {
  return (
    <AuthLayout>
      <AuthStatusCard
        title="Cargando la orden…"
        message="Estamos preparando la captura de surtido."
      >
        <AuthLoadingSpinner />
      </AuthStatusCard>
    </AuthLayout>
  );
}
