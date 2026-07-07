import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type PolariaRequestEndpointTone = "teal" | "warning" | "neutral";

export interface PolariaRequestFlowEndpoint {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: PolariaRequestEndpointTone;
}

export interface PolariaRequestMetadataItem {
  icon: LucideIcon;
  label: string;
  value: string;
}

export interface PolariaRequestPanelProps {
  title: string;
  icon?: LucideIcon;
  pendingCount?: number;
  totalCount?: number;
  /** Etiqueta del contador total. Por defecto: N solicitud/es */
  formatTotalCount?: (count: number) => string;
  /** Muestra badge fijo «Pendiente» (sin número), p. ej. vista operario. */
  showPendingStatus?: boolean;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage: string;
  emptyHint?: string;
  children?: ReactNode;
  /** Acciones fijas al pie del panel (p. ej. Alertas / Llamar en operario). */
  footer?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export interface PolariaRequestActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  tone?: "teal" | "warning" | "neutral";
  onClick?: () => void;
  disabled?: boolean;
}

export interface PolariaRequestActionBarProps {
  actions: readonly PolariaRequestActionItem[];
  className?: string;
}

export interface PolariaRequestFlowCardProps {
  hint?: string;
  source: PolariaRequestFlowEndpoint;
  destination: PolariaRequestFlowEndpoint;
  typeLabel?: string;
  metadata: PolariaRequestMetadataItem[];
  isInteractive?: boolean;
  onClick?: () => void;
  className?: string;
}
