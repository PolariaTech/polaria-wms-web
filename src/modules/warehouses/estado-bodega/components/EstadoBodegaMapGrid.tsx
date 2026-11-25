import type { ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils/cn";
import type { EstadoBodegaSectionId } from "../constants/estado-bodega-layout";

export interface EstadoBodegaSectionPanelOptions {
  compact?: boolean;
  fillHeight?: boolean;
  className?: string;
}

export function EstadoBodegaMapGrid({
  mapRef,
  renderSectionPanel,
}: {
  mapRef: RefObject<HTMLDivElement | null>;
  renderSectionPanel: (
    sectionId: EstadoBodegaSectionId,
    panelProps?: EstadoBodegaSectionPanelOptions,
  ) => ReactNode;
}) {
  return (
  <div
    ref={mapRef}
    className={cn(
      "mx-auto grid w-fit max-w-full grid-cols-1 gap-3",
      "lg:grid-cols-[auto_auto_auto] lg:items-stretch",
    )}
  >
    <div className="flex min-h-[14rem] min-w-0 flex-col items-center lg:min-h-0 lg:h-full">
      {renderSectionPanel("entrada", {
        compact: true,
        fillHeight: true,
        className: "h-full min-h-0",
      })}
    </div>

    <div className="flex min-h-[14rem] min-w-0 flex-col items-center gap-2.5 lg:min-h-0 lg:h-full">
      {renderSectionPanel("almacenamiento", { compact: true })}
      {renderSectionPanel("procesamiento", { compact: true })}
    </div>

    <div className="flex min-h-[14rem] min-w-0 flex-col items-center lg:min-h-0 lg:h-full">
      {renderSectionPanel("salida", {
        compact: true,
        fillHeight: true,
        className: "h-full min-h-0",
      })}
    </div>
  </div>
  );
}
