import type { FormEvent, ReactNode, Ref } from "react";

export type PolariaFormModalProps = {
  open: boolean;
  onClose: () => void;
  sectionLabel?: string;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error?: string | null;
  isSubmitting?: boolean;
  submittingIndicator?: ReactNode;
  submitDisabled?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  closeLabel?: string;
  className?: string;
  compact?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  scrollClassName?: string;
  footerAction?: ReactNode;
  footerLeading?: ReactNode;
  footerCenter?: ReactNode;
  /** Acciones justo a la izquierda de Cancelar (REQ-232). */
  footerBeforeCancel?: ReactNode;
  hideFooter?: boolean;
  hideHeaderClose?: boolean;
  headerTrailing?: ReactNode;
  headerCenter?: ReactNode;
  layout?: "center" | "dock-left";
  asForm?: boolean;
  stackLevel?: "base" | "elevated" | "nested";
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  submitOnEnter?: boolean;
  scrollRegionRef?: Ref<HTMLDivElement | null>;
};
