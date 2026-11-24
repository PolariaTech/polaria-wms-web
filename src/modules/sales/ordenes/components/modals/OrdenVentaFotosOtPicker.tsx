import { PolariaRemoteImage } from "@/components/shared/media/PolariaRemoteImage";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { resolveOtFotoDisplay } from "./resolve-ot-foto-display";
import type { OrdenVentaOtConFotosItem } from "./orden-venta-fotos-captura.types";

export function OrdenVentaFotosOtPicker({
  ordenesTrabajo,
  isLoadingOts,
  onSelectOt,
}: {
  ordenesTrabajo: OrdenVentaOtConFotosItem[];
  isLoadingOts: boolean;
  onSelectOt: (idOrdenTrabajo: string) => void;
}) {
  if (isLoadingOts) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center py-10 text-polaria-w-50">
        Cargando órdenes de trabajo…
      </div>
    );
  }

  if (ordenesTrabajo.length === 0) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center py-10 text-polaria-w-50">
        Aún no hay fotos. El jefe debe escanear el QR y subir la hoja.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {ordenesTrabajo.map((ot) => {
        const display = resolveOtFotoDisplay(ot);
        return (
          <li key={ot.idOrdenTrabajo || "__sin_ot__"}>
            <button
              type="button"
              onClick={() => onSelectOt(ot.idOrdenTrabajo)}
              className="flex w-full items-center gap-3 overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-3 text-left transition hover:border-polaria-teal"
            >
              <PolariaRemoteImage
                src={ot.previewUrl}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1 space-y-1">
                {display.numeroPedido ? (
                  <span className="block truncate font-medium text-polaria-w">
                    Pedido {display.numeroPedido}
                  </span>
                ) : (
                  <span className="block truncate font-medium text-polaria-w">
                    {display.label}
                  </span>
                )}
                {display.centroConsumo ? (
                  <span className="block truncate text-polaria-teal polaria-text-body-sm">
                    Centro de consumo: {display.centroConsumo}
                  </span>
                ) : null}
                <span className="block text-polaria-w-50 polaria-text-body-sm">
                  {ot.totalFotos}{" "}
                  {ot.totalFotos === 1 ? "foto" : "fotos"}
                  {ot.ultimaAt
                    ? ` · última ${formatDateTime(ot.ultimaAt)}`
                    : ""}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}