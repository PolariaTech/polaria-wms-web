"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { firmaCanvasToDataUrl } from "./transporte-entrega.helpers";

export function useTransporteEntregaFirma(open: boolean, paso: number) {
  const [firmaDataUrl, setFirmaDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const firmaDibujadaRef = useRef(false);

  const resetFirma = useCallback(() => {
    setFirmaDataUrl(null);
    firmaDibujadaRef.current = false;
  }, []);

  useEffect(() => {
    if (!open || paso !== 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f8f8f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#020609";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (firmaDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = firmaDataUrl;
    }
  }, [firmaDataUrl, open, paso]);

  const clearFirma = () => {
    firmaDibujadaRef.current = false;
    setFirmaDataUrl(null);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.fillStyle = "#f8f8f6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const pointerPos = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ): { x: number; y: number } => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    firmaDibujadaRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    const { x, y } = pointerPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    if (canvasRef.current && firmaDibujadaRef.current) {
      setFirmaDataUrl(firmaCanvasToDataUrl(canvasRef.current));
    }
  };

  /** Hay firma guardada o dibujada en el canvas. */
  const hasFirma = (): boolean =>
    Boolean(
      firmaDataUrl?.trim() || (firmaDibujadaRef.current && canvasRef.current),
    );

  /** Persiste en estado la firma dibujada en el canvas (si existe). */
  const captureFirma = () => {
    if (canvasRef.current && firmaDibujadaRef.current) {
      setFirmaDataUrl(firmaCanvasToDataUrl(canvasRef.current));
    }
  };

  /** Data URL final de la firma, o cadena vacía. */
  const resolveFirmaRaw = (): string =>
    firmaDataUrl?.trim() ||
    (firmaDibujadaRef.current && canvasRef.current
      ? firmaCanvasToDataUrl(canvasRef.current)
      : "");

  return {
    canvasRef,
    resetFirma,
    clearFirma,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    hasFirma,
    captureFirma,
    resolveFirmaRaw,
  };
}
