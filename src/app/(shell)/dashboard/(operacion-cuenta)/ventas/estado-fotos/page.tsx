"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { EstadoFotosPageContent } from "@/modules/sales/ordenes/surtido/estado-fotos/EstadoFotosPageContent";
import { useAuthStore } from "@/stores/auth.store";

/** POL-406: solo administrador y operador de cuenta; cualquier otro rol vuelve al inicio. */
export default function DashboardVentasEstadoFotosPage() {
  const router = useRouter();
  const idRol = useAuthStore((estado) => estado.session?.idRol);
  const permitido = !!idRol && (ROLES_NIVEL_CUENTA as readonly string[]).includes(idRol);
  const hayRolDeOtroNivel = !!idRol && !permitido;

  useEffect(() => {
    if (hayRolDeOtroNivel) router.replace(ROUTES.dashboard);
  }, [hayRolDeOtroNivel, router]);

  if (!permitido) return null;
  return <EstadoFotosPageContent />;
}
