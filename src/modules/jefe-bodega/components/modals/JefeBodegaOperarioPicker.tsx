"use client";

import { User } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { JefeBodegaOperarioAsignacionState } from "../../hooks/useJefeBodegaOperarioAsignacion";
import { formatOperarioPickerLabel } from "../../services/jefe-bodega-operarios.service";
import {
  JefeBodegaModalHint,
  JefeBodegaModalSearchField,
  JefeBodegaModalSection,
} from "./jefe-bodega-modal-ui";
import { JefeBodegaOperarioPickerModal } from "./JefeBodegaOperarioPickerModal";

interface JefeBodegaOperarioPickerProps {
  asignacion: JefeBodegaOperarioAsignacionState;
}

export function JefeBodegaOperarioPicker({
  asignacion,
}: JefeBodegaOperarioPickerProps) {
  const {
    disponibles,
    idSeleccionado,
    setIdSeleccionado,
    isLoading,
    operarioUnico,
    blockReason,
    operarios,
  } = asignacion;

  const [pickerOpen, setPickerOpen] = useState(false);

  const operariosElegibles = useMemo(
    () =>
      disponibles.length > 0
        ? disponibles
        : operarioUnico?.disponible
          ? [operarioUnico]
          : [],
    [disponibles, operarioUnico],
  );

  const operarioSeleccionado = useMemo(
    () =>
      operariosElegibles.find((operario) => operario.idUsuario === idSeleccionado) ??
      operariosElegibles[0] ??
      null,
    [idSeleccionado, operariosElegibles],
  );

  const fieldLabel = operarioSeleccionado
    ? formatOperarioPickerLabel(operarioSeleccionado)
    : "";

  if (!isLoading && operarios.length === 0) {
    return (
      <JefeBodegaModalSection icon={User} label="Operario">
        <p role="alert" className="polaria-text-body-sm text-polaria-danger">
          {blockReason ?? "No hay operarios asignados a esta bodega."}
        </p>
      </JefeBodegaModalSection>
    );
  }

  if (isLoading) {
    return (
      <JefeBodegaModalSection icon={User} label="Operario">
        <JefeBodegaModalSearchField
          id="jefe-bodega-operario-loading"
          value=""
          placeholder="Cargando operarios…"
          ariaLabel="Operario"
        />
      </JefeBodegaModalSection>
    );
  }

  if (operariosElegibles.length > 0) {
    const pickerModal = (
      <JefeBodegaOperarioPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        operarios={operariosElegibles}
        selectedId={operarioSeleccionado?.idUsuario ?? null}
        onSelect={(operario) => setIdSeleccionado(operario.idUsuario)}
      />
    );

    return (
      <>
        <JefeBodegaModalSection icon={User} label="Operario">
          <div
            role="presentation"
            onClick={() => setPickerOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setPickerOpen(true);
              }
            }}
            className="cursor-pointer"
          >
            <JefeBodegaModalSearchField
              id="jefe-bodega-operario"
              value={fieldLabel}
              placeholder="Seleccionar operario"
              ariaLabel="Operario"
              onSearchClick={() => setPickerOpen(true)}
            />
          </div>
          <JefeBodegaModalHint>
            {operariosElegibles.length === 1
              ? "Único operario con sesión activa en esta bodega."
              : "Solo operarios con sesión activa. Ordenados por menor carga de tareas."}
          </JefeBodegaModalHint>
        </JefeBodegaModalSection>

        {typeof document !== "undefined"
          ? createPortal(pickerModal, document.body)
          : null}
      </>
    );
  }

  if (blockReason) {
    return (
      <JefeBodegaModalSection icon={User} label="Operario">
        <p role="alert" className="polaria-text-body-sm text-polaria-danger">
          {blockReason}
        </p>
      </JefeBodegaModalSection>
    );
  }

  return null;
}
