"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaTableCode } from "@/components/shared/table/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import { WMS_ROL_LABELS } from "@/constants/wms/wms-roles";
import { WmsRol } from "@/constants/wms/roles";
import { useAuthStore } from "@/stores/auth.store";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  formatUsuarioAdminCreatedAt,
  type UsuarioAdminListRow,
} from "../services/usuarios-admin.service";
import { UsuarioAdminResetPasswordModal } from "./UsuarioAdminResetPasswordModal";

interface UsuarioAdminDetalleModalProps {
  open: boolean;
  usuario: UsuarioAdminListRow | null;
  onClose: () => void;
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="polaria-text-label text-polaria-w-20">{label}</p>
      <div className="mt-1 break-words polaria-text-body-sm font-medium text-polaria-w">
        {children}
      </div>
    </div>
  );
}

export function UsuarioAdminDetalleModal({
  open,
  usuario,
  onClose,
}: UsuarioAdminDetalleModalProps) {
  const { codigoEmpresa } = useCompany();
  const session = useAuthStore((state) => state.session);
  const [isResetOpen, setIsResetOpen] = useState(false);

  useEffect(() => {
    if (!open) setIsResetOpen(false);
  }, [open]);

  const empresaAsignada =
    session?.razonSocialEmpresa ?? codigoEmpresa ?? "—";
  const telefono =
    usuario && usuario.telefono !== "—"
      ? formatInternationalPhoneDisplay(usuario.telefono)
      : "—";

  const handleClose = () => {
    if (isResetOpen) return;
    onClose();
  };

  return (
    <>
      <PolariaFormModal
        open={open && Boolean(usuario)}
        onClose={handleClose}
        sectionLabel="Detalle de usuario"
        title={usuario?.nombre ?? "Usuario"}
        description="Consulta los datos del operador y restablece su contraseña."
        onSubmit={(event) => {
          event.preventDefault();
          setIsResetOpen(true);
        }}
        asForm={false}
        submitLabel="Restablecer contraseña"
        cancelLabel="Cerrar"
        compact
        closeOnEscape={!isResetOpen}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetaField label="Código">
            <PolariaTableCode>{usuario?.codigo ?? "—"}</PolariaTableCode>
          </MetaField>
          <MetaField label="Nombre">{usuario?.nombre ?? "—"}</MetaField>
          <MetaField label="Rol">
            {WMS_ROL_LABELS[WmsRol.operador_cuenta]}
          </MetaField>
          <MetaField label="Asignado">{empresaAsignada}</MetaField>
          <MetaField label="Correo">{usuario?.correo ?? "—"}</MetaField>
          <MetaField label="Teléfono">{telefono}</MetaField>
          <MetaField label="Alta">
            {usuario ? formatUsuarioAdminCreatedAt(usuario.createdAt) : "—"}
          </MetaField>
        </div>
      </PolariaFormModal>

      <UsuarioAdminResetPasswordModal
        open={isResetOpen}
        usuario={usuario}
        onClose={() => setIsResetOpen(false)}
        onReset={() => setIsResetOpen(false)}
      />
    </>
  );
}
