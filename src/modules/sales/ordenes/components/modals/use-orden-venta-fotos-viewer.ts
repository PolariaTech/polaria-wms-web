import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

export function useOrdenVentaFotosViewer(
  open: boolean,
  showingFotos: boolean,
  selectedOt: string | null,
  fotosLength: number,
) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsPanning(false);
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (!open || !showingFotos) {
      setIndex(0);
      resetView();
      return;
    }
    setIndex(0);
    resetView();
  }, [open, showingFotos, selectedOt, fotosLength, resetView]);

  const goPrev = useCallback(() => {
    setIndex((current) => {
      if (fotosLength <= 1) return current;
      return (current - 1 + fotosLength) % fotosLength;
    });
    resetView();
  }, [fotosLength, resetView]);

  const goNext = useCallback(() => {
    setIndex((current) => {
      if (fotosLength <= 1) return current;
      return (current + 1) % fotosLength;
    });
    resetView();
  }, [fotosLength, resetView]);

  const setZoomClamped = useCallback((next: number) => {
    const clamped = Math.min(4, Math.max(1, Number(next.toFixed(2))));
    setZoom(clamped);
    if (clamped <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, []);

  const onPanPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (zoom <= 1 || event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: pan.x,
        originY: pan.y,
      };
      setIsPanning(true);
    },
    [zoom, pan.x, pan.y],
  );

  const onPanPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      setPan({
        x: drag.originX + (event.clientX - drag.startX),
        y: drag.originY + (event.clientY - drag.startY),
      });
    },
    [],
  );

  const onPanPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setIsPanning(false);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    },
    [],
  );

  useEffect(() => {
    if (!open || !showingFotos || fotosLength === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (zoom > 1) {
          setPan((p) => ({ ...p, x: p.x + 48 }));
        } else {
          goPrev();
        }
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (zoom > 1) {
          setPan((p) => ({ ...p, x: p.x - 48 }));
        } else {
          goNext();
        }
      } else if (event.key === "ArrowUp") {
        if (zoom > 1) {
          event.preventDefault();
          setPan((p) => ({ ...p, y: p.y + 48 }));
        }
      } else if (event.key === "ArrowDown") {
        if (zoom > 1) {
          event.preventDefault();
          setPan((p) => ({ ...p, y: p.y - 48 }));
        }
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoomClamped(zoom + 0.25);
      } else if (event.key === "-") {
        event.preventDefault();
        setZoomClamped(zoom - 0.25);
      } else if (event.key === "0") {
        event.preventDefault();
        resetView();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    open,
    showingFotos,
    fotosLength,
    goPrev,
    goNext,
    zoom,
    setZoomClamped,
    resetView,
  ]);

  const selectIndex = useCallback(
    (fotoIndex: number) => {
      setIndex(fotoIndex);
      resetView();
    },
    [resetView],
  );

  const onGalleryWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        setZoomClamped(zoom + delta);
        return;
      }
      if (zoom <= 1) return;
      event.preventDefault();
      setPan((p) => ({
        x: p.x - event.deltaX,
        y: p.y - event.deltaY,
      }));
    },
    [zoom, setZoomClamped],
  );

  return {
    index,
    zoom,
    pan,
    isPanning,
    resetView,
    goPrev,
    goNext,
    setZoomClamped,
    onPanPointerDown,
    onPanPointerMove,
    onPanPointerUp,
    selectIndex,
    onGalleryWheel,
  };
}