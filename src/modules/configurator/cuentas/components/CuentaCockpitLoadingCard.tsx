import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";

interface CuentaCockpitLoadingCardProps {
  title?: string;
  message?: string;
}

export function CuentaCockpitLoadingCard({
  title = "Cargando cuenta…",
  message = "Estamos abriendo el control de esta cuenta.",
}: CuentaCockpitLoadingCardProps) {
  return (
    <PolariaStatusLoading
      title={title}
      message={message}
      className="m-auto flex-1 py-10"
    />
  );
}
