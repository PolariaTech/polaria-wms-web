import type { ReactNode } from "react";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { cn } from "@/lib/utils/cn";
import type { ProcesamientoDesgloseEstimado } from "../../shared/constants/procesamiento-conversion";

export function ProcesamientoFieldBox({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="polaria-text-label text-polaria-w-50">{label}</span>
      <div className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3">
        {children}
      </div>
    </div>
  );
}

export function ProcesamientoCantidadBody({
  idBodega,
  stockLoading,
  maxCantidad,
  cantidadElegida,
  setCantidadElegida,
  isSubmitting,
  cantidadLista,
}: {
  idBodega: string;
  stockLoading: boolean;
  maxCantidad: number;
  cantidadElegida: number;
  setCantidadElegida: (value: number) => void;
  isSubmitting: boolean;
  cantidadLista: boolean;
}) {
  return (
    <>
      {!idBodega ? (
        <p className="polaria-text-body-sm text-polaria-warning">Sin bodega interna.</p>
      ) : stockLoading ? (
        <PolariaStatusLoading
          embedded
          className="py-2"
          message="Estamos consultando el stock del mapa."
        />
      ) : maxCantidad <= 0 ? (
        <p className="polaria-text-body-sm text-polaria-warning">Sin stock mapa.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="polaria-text-caption text-polaria-w-50">
              Máx.{" "}
              <span className="font-medium text-polaria-w">
                {maxCantidad.toLocaleString("es-CL")} kg
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={maxCantidad}
              step={1}
              value={Math.min(Math.round(cantidadElegida), maxCantidad)}
              onChange={(event) => {
                setCantidadElegida(Math.round(Number(event.target.value)));
              }}
              disabled={isSubmitting || !cantidadLista}
              className="min-w-0 flex-1 accent-polaria-teal"
              aria-label="Cantidad a procesar en kilogramos"
            />
            <span className="w-16 shrink-0 text-right polaria-text-body-sm font-semibold tabular-nums text-polaria-w">
              {Math.round(cantidadElegida).toLocaleString("es-CL")}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

export function ProcesamientoEstimadoBody({
  desgloseEstimado,
  perdidaPctDelCatalogo,
}: {
  desgloseEstimado: ProcesamientoDesgloseEstimado | null;
  perdidaPctDelCatalogo: number;
}) {
  return (
    <>
      {desgloseEstimado ? (
        <ul className="flex flex-col gap-2.5 polaria-text-body-sm text-polaria-w">
          <li>
            <span className="polaria-text-caption text-polaria-w-50">Ud. netas</span>
            <p className="font-semibold tabular-nums">
              {desgloseEstimado.uInt.toLocaleString("es-CL")} ud.
            </p>
          </li>
          <li>
            <span className="polaria-text-caption text-polaria-w-50">Sobrante</span>
            <p className="font-semibold tabular-nums">
              {desgloseEstimado.sobranteKg.toLocaleString("es-CL", {
                maximumFractionDigits: 3,
              })}{" "}
              kg
            </p>
          </li>
          <li>
            <span className="polaria-text-caption text-polaria-w-50">Merma</span>
            {desgloseEstimado.mermaUnidades !== null &&
            desgloseEstimado.mermaKg !== null ? (
              <p className="font-semibold tabular-nums">
                ≈{" "}
                {desgloseEstimado.mermaUnidades.toLocaleString("es-CL", {
                  maximumFractionDigits: 4,
                })}{" "}
                u. · ≈{" "}
                {desgloseEstimado.mermaKg.toLocaleString("es-CL", {
                  maximumFractionDigits: 3,
                })}{" "}
                kg
                {perdidaPctDelCatalogo > 0 ? (
                  <span className="ml-1 polaria-text-caption font-normal text-polaria-w-50">
                    ({Math.round(perdidaPctDelCatalogo).toLocaleString("es-CL")}% cat.)
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="text-polaria-w-50">—</p>
            )}
          </li>
        </ul>
      ) : (
        <p className="polaria-text-body-sm text-polaria-warning">Indicá conversión.</p>
      )}
    </>
  );
}
