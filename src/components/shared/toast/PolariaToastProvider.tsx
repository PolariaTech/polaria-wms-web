"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

export type PolariaToastVariant = "success" | "error" | "info" | "dark";

export interface PolariaToastInput {
  title?: string;
  content: string;
  variant?: PolariaToastVariant;
  /** Duración visible en ms (default 3000). */
  durationMs?: number;
}

interface PolariaToastItem extends Required<Pick<PolariaToastInput, "content">> {
  id: string;
  title?: string;
  variant: PolariaToastVariant;
  durationMs: number;
  visible: boolean;
}

interface PolariaToastContextValue {
  showToast: (input: PolariaToastInput) => void;
}

const PolariaToastContext = createContext<PolariaToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 3000;

function PolariaToastStack({ toasts, onDismiss }: {
  toasts: PolariaToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="polaria-toast-stack"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "polaria-toast",
            `polaria-toast--${toast.variant}`,
            toast.visible && "polaria-toast--visible",
          )}
        >
          <div className="polaria-toast__wrapper">
            {toast.title ? (
              <h3 className="polaria-toast__header">{toast.title}</h3>
            ) : null}
            <p className="polaria-toast__content">{toast.content}</p>
          </div>
          <button
            type="button"
            className="polaria-toast__close"
            aria-label="Cerrar notificación"
            onClick={() => onDismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function PolariaToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<PolariaToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, visible: false } : toast,
      ),
    );

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 200);
  }, []);

  const showToast = useCallback(
    (input: PolariaToastInput) => {
      const id = crypto.randomUUID();
      const durationMs = input.durationMs ?? DEFAULT_DURATION_MS;
      const item: PolariaToastItem = {
        id,
        title: input.title,
        content: input.content,
        variant: input.variant ?? "dark",
        durationMs,
        visible: false,
      };

      setToasts((current) => [...current, item]);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setToasts((current) =>
            current.map((toast) =>
              toast.id === id ? { ...toast, visible: true } : toast,
            ),
          );
        });
      });

      const timer = window.setTimeout(() => {
        dismissToast(id);
        timersRef.current.delete(id);
      }, durationMs);

      timersRef.current.set(id, timer);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <PolariaToastContext.Provider value={value}>
      {children}
      {mounted ? (
        <PolariaToastStack toasts={toasts} onDismiss={dismissToast} />
      ) : null}
    </PolariaToastContext.Provider>
  );
}

export function usePolariaToast(): PolariaToastContextValue {
  const context = useContext(PolariaToastContext);
  if (!context) {
    throw new Error("usePolariaToast debe usarse dentro de PolariaToastProvider");
  }
  return context;
}
