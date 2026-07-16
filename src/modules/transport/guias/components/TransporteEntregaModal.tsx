"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Camera,
  CheckCircle2,
  Package,
  PenLine,
} from "lucide-react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { getOrdenVentaDetalle } from "@/modules/sales";
import type { OrdenVentaDetalleRow } from "@/modules/sales";
import {
  registrarEntregaApi,
  uploadEvidenciaTransporteApi,
} from "../../shared/services/transport-api.service";
import type { ViajeEntregaRow } from "../../shared/types/transport.types";

const PASOS_ENTREGA = 4;
const MAX_EVIDENCIA_BYTES = 10 * 1024 * 1024;

interface TransporteEntregaModalProps {
  open: boolean;
  viaje: ViajeEntregaRow | null;
  codigoCuenta: string | null;
  idBodega: string | null;
  onClose: () => void;
  onEntregado: () => void;
}

function firmaCanvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

function parseCantidad(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function lineaProductoLabel(
  linea: OrdenVentaDetalleRow["lineas"][number],
): string {
  const producto = linea.producto;
  const sku = producto?.sku?.trim();
  const desc = producto?.descripcion?.trim();
  if (sku && desc) return `${sku} ${desc}`;
  return desc || sku || "Producto";
}

export function TransporteEntregaModal({
  open,
  viaje,
  codigoCuenta,
  idBodega,
  onClose,
  onEntregado,
}: TransporteEntregaModalProps) {
  const [paso, setPaso] = useState(0);
  const [detalle, setDetalle] = useState<OrdenVentaDetalleRow | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [detalleError, setDetalleError] = useState<string | null>(null);
  const [lineaVerificada, setLineaVerificada] = useState<
    Record<number, boolean>
  >({});
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [firmaDataUrl, setFirmaDataUrl] = useState<string | null>(null);
  const [conforme, setConforme] = useState<boolean | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const firmaDibujadaRef = useRef(false);

  const resetState = useCallback(() => {
    setPaso(0);
    setDetalle(null);
    setDetalleError(null);
    setLineaVerificada({});
    setCantidades({});
    setFotoFile(null);
    setFotoPreview(null);
    setFirmaDataUrl(null);
    setConforme(null);
    setDescripcion("");
    setError(null);
    setSaving(false);
    firmaDibujadaRef.current = false;
  }, []);

  useEffect(() => {
    if (!open || !viaje?.idOrdenVenta || !codigoCuenta?.trim()) {
      if (!open) resetState();
      return;
    }

    let cancelled = false;
    setLoadingDetalle(true);
    setDetalleError(null);

    void getOrdenVentaDetalle({
      codigoCuenta,
      idOrdenVenta: viaje.idOrdenVenta,
    })
      .then((row) => {
        if (cancelled) return;
        setDetalle(row);
        const nextCant: Record<number, string> = {};
        const nextChk: Record<number, boolean> = {};
        row.lineas.forEach((linea, index) => {
          nextCant[index] = String(linea.cantidad_pedida ?? "");
          nextChk[index] = false;
        });
        setCantidades(nextCant);
        setLineaVerificada(nextChk);
        setPaso(0);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDetalle(null);
        setDetalleError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los productos de la venta.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingDetalle(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, open, resetState, viaje?.idOrdenVenta]);

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

  const onFotoChange = (fileList: FileList | null) => {
    const file = fileList?.[0] ?? null;
    setError(null);
    if (!file) {
      setFotoFile(null);
      setFotoPreview(null);
      return;
    }
    if (file.size > MAX_EVIDENCIA_BYTES) {
      setError("La imagen supera 10 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes.");
      return;
    }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const canGoNext = (): boolean => {
    if (!detalle) return false;
    if (paso === 0) {
      return detalle.lineas.every((_, index) => {
        if (!lineaVerificada[index]) return false;
        return parseCantidad(cantidades[index] ?? "") != null;
      });
    }
    if (paso === 1) return Boolean(fotoFile);
    if (paso === 2) {
      return Boolean(
        firmaDataUrl?.trim() ||
          (firmaDibujadaRef.current && canvasRef.current),
      );
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (!canGoNext()) {
      if (paso === 0) {
        setError(
          "Verificá todos los productos e indicá la cantidad entregada.",
        );
      } else if (paso === 1) {
        setError("La foto de evidencia es obligatoria.");
      } else if (paso === 2) {
        setError("La firma de quien recibe es obligatoria.");
      }
      return;
    }
    if (paso === 2 && canvasRef.current && firmaDibujadaRef.current) {
      setFirmaDataUrl(firmaCanvasToDataUrl(canvasRef.current));
    }
    setPaso((current) => Math.min(PASOS_ENTREGA - 1, current + 1));
  };

  const handleBack = () => {
    setError(null);
    setPaso((current) => Math.max(0, current - 1));
  };

  const handleClose = () => {
    if (saving) return;
    resetState();
    onClose();
  };

  const handleEntregar = async () => {
    if (!viaje || !detalle || !codigoCuenta?.trim() || !idBodega?.trim()) {
      setError("Falta información del viaje o de la bodega.");
      return;
    }
    if (!viaje.idGuia || !viaje.idOrdenVenta) {
      setError("El viaje no tiene guía u orden de venta asociada.");
      return;
    }
    if (paso !== PASOS_ENTREGA - 1) {
      setError("Completá todos los pasos antes de cerrar la entrega.");
      return;
    }
    if (conforme === null) {
      setError("Indicá si el pedido fue conforme (sí o no).");
      return;
    }
    if (!fotoFile) {
      setError("La foto de evidencia es obligatoria.");
      return;
    }
    const firmaRaw =
      firmaDataUrl?.trim() ||
      (firmaDibujadaRef.current && canvasRef.current
        ? firmaCanvasToDataUrl(canvasRef.current)
        : "");
    if (!firmaRaw.trim()) {
      setError("La firma de quien recibe es obligatoria.");
      return;
    }
    if (!conforme && !descripcion.trim()) {
      setError("Si no estás conforme, describí el motivo antes de cerrar.");
      return;
    }

    const lineas: Array<{
      idLineaOrdenVenta: string;
      cantidadEntregada: number;
    }> = [];
    for (const [index, linea] of detalle.lineas.entries()) {
      const cantidad = parseCantidad(cantidades[index] ?? "");
      if (cantidad == null) {
        setError("Revisá las cantidades entregadas: hay un valor inválido.");
        return;
      }
      lineas.push({
        idLineaOrdenVenta: linea.id_linea_orden_venta,
        cantidadEntregada: cantidad,
      });
    }

    setSaving(true);
    setError(null);
    try {
      const [evidenciaFotoUrl, evidenciaFirmaUrl] = await Promise.all([
        uploadEvidenciaTransporteApi(fotoFile),
        uploadEvidenciaTransporteApi(
          await dataUrlToFile(firmaRaw, "firma-entrega.jpg"),
        ),
      ]);

      await registrarEntregaApi({
        codigoCuenta,
        idBodega,
        idViaje: viaje.idViaje,
        idGuia: viaje.idGuia,
        idOrdenVenta: viaje.idOrdenVenta,
        entregaConforme: conforme,
        descripcionIncidencia: conforme ? undefined : descripcion.trim(),
        evidenciaFotoUrl,
        evidenciaFirmaUrl,
        lineas,
      });

      resetState();
      onEntregado();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cerrar la entrega.",
      );
    } finally {
      setSaving(false);
    }
  };

  const title = viaje
    ? `Entrega · ${viaje.codigoViaje}`
    : "Realizar entrega";

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title={title}
      description={
        viaje
          ? `${viaje.codigoVenta} · ${viaje.clienteNombre}`
          : "Completá los pasos de evidencia."
      }
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideHeaderClose
      compact
      size="lg"
      error={error}
      isSubmitting={saving}
      footerAction={
        <div className="flex flex-row flex-wrap items-center justify-end gap-2">
          {paso > 0 ? (
            <button
              type="button"
              disabled={saving}
              onClick={handleBack}
              className="rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-4 py-2.5 polaria-text-body-sm font-medium text-polaria-w transition hover:border-polaria-teal hover:text-polaria-teal disabled:opacity-50"
            >
              Anterior
            </button>
          ) : null}
          {paso < PASOS_ENTREGA - 1 ? (
            <button
              type="button"
              disabled={saving || loadingDetalle || !detalle}
              onClick={handleNext}
              className="rounded-xl bg-polaria-teal px-4 py-2.5 polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90 disabled:opacity-50"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || loadingDetalle || !detalle}
              onClick={() => void handleEntregar()}
              className="rounded-xl bg-polaria-teal px-4 py-2.5 polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Cerrando…" : "Cerrar entrega"}
            </button>
          )}
        </div>
      }
      cancelLabel="Cancelar"
    >
      <p className="mb-3 text-center polaria-text-caption font-semibold uppercase tracking-wide text-polaria-w-50">
        Paso {paso + 1} de {PASOS_ENTREGA}
      </p>

      {loadingDetalle ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          Cargando productos…
        </p>
      ) : null}

      {detalleError ? (
        <p className="rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-3 py-3 polaria-text-body-sm text-polaria-danger">
          {detalleError}
        </p>
      ) : null}

      {!loadingDetalle && !detalleError && detalle && paso === 0 ? (
        <section className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-3">
          <p className="mb-1 flex items-center gap-2 polaria-text-caption font-semibold uppercase tracking-wide text-polaria-teal">
            <Package className="h-4 w-4" aria-hidden />
            Verificar productos
          </p>
          <p className="mb-3 polaria-text-caption text-polaria-w-50">
            Marcá cada ítem como verificado e indicá la cantidad entregada.
          </p>
          <ul className="space-y-3">
            {detalle.lineas.map((linea, index) => (
              <li
                key={linea.id_linea_orden_venta}
                className="rounded-xl border border-polaria-w-08 bg-polaria-bg/40 px-3 py-3"
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(lineaVerificada[index])}
                    onChange={(event) =>
                      setLineaVerificada((prev) => ({
                        ...prev,
                        [index]: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-polaria-teal"
                  />
                  <span className="min-w-0 flex-1 polaria-text-body-sm font-medium text-polaria-w">
                    {lineaProductoLabel(linea)}
                  </span>
                </label>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-polaria-w-08 pt-3">
                  <span className="polaria-text-caption text-polaria-w-50">
                    Pedido:{" "}
                    <strong className="text-polaria-w">
                      {formatKgEs(linea.cantidad_pedida)} kg
                    </strong>
                  </span>
                  <label className="flex items-center gap-2 polaria-text-caption text-polaria-w-50">
                    Entregada
                    <input
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={cantidades[index] ?? ""}
                      onChange={(event) =>
                        setCantidades((prev) => ({
                          ...prev,
                          [index]: event.target.value,
                        }))
                      }
                      className="w-24 rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-2 py-1.5 text-right polaria-text-body-sm font-semibold text-polaria-w outline-none focus:border-polaria-t-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!loadingDetalle && !detalleError && paso === 1 ? (
        <label className="flex cursor-pointer flex-col gap-3">
          <span className="flex items-center gap-2 polaria-text-body-sm font-semibold text-polaria-w">
            <Camera className="h-4 w-4 text-polaria-teal" aria-hidden />
            Evidencia de la entrega (foto) *
          </span>
          <div className="relative flex min-h-[9rem] flex-col items-center justify-center rounded-xl border-2 border-dashed border-polaria-t-20 bg-polaria-t-08 px-4 py-6">
            <span className="rounded-xl bg-polaria-teal px-4 py-2.5 polaria-text-body-sm font-bold text-polaria-bg">
              {fotoFile ? "Cambiar foto" : "Elegir archivo"}
            </span>
            <span className="mt-2 polaria-text-caption text-polaria-w-50">
              Cámara o galería · hasta 10 MB
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => onFotoChange(event.target.files)}
              aria-label="Elegir foto de evidencia"
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
          {fotoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoPreview}
              alt="Vista previa de evidencia"
              className="max-h-48 w-full rounded-xl border border-polaria-w-08 object-contain"
            />
          ) : null}
        </label>
      ) : null}

      {!loadingDetalle && !detalleError && paso === 2 ? (
        <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-3">
          <p className="mb-2 flex items-center gap-2 polaria-text-body-sm font-semibold text-polaria-w">
            <PenLine className="h-4 w-4 text-polaria-teal" aria-hidden />
            Firma de quien recibe *
          </p>
          <canvas
            ref={canvasRef}
            width={400}
            height={160}
            className="w-full touch-none rounded-xl border border-polaria-w-08 bg-polaria-w"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
          <button
            type="button"
            onClick={clearFirma}
            className="mt-2 rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-3 py-2 polaria-text-caption font-medium text-polaria-w transition hover:border-polaria-teal hover:text-polaria-teal"
          >
            Limpiar firma
          </button>
        </div>
      ) : null}

      {!loadingDetalle && !detalleError && paso === 3 ? (
        <section className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-3">
          <p className="mb-1 flex items-center gap-2 polaria-text-caption font-semibold uppercase tracking-wide text-polaria-teal">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Conformidad
          </p>
          <p className="mb-3 polaria-text-caption text-polaria-w-50">
            El cierre final combina conformidad y si las cantidades coinciden
            con el pedido.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setConforme(true);
                setDescripcion("");
              }}
              className={cn(
                "rounded-xl border px-3 py-2.5 polaria-text-body-sm font-semibold transition",
                conforme === true
                  ? "border-polaria-teal bg-polaria-teal text-polaria-bg"
                  : "border-polaria-t-20 bg-polaria-w-08 text-polaria-w hover:border-polaria-teal",
              )}
            >
              Sí, conforme
            </button>
            <button
              type="button"
              onClick={() => setConforme(false)}
              className={cn(
                "rounded-xl border px-3 py-2.5 polaria-text-body-sm font-semibold transition",
                conforme === false
                  ? "border-polaria-danger bg-polaria-danger-bg text-polaria-danger"
                  : "border-polaria-t-20 bg-polaria-w-08 text-polaria-w hover:border-polaria-teal",
              )}
            >
              No conforme
            </button>
          </div>
          {conforme === false ? (
            <label className="mt-3 grid gap-1.5">
              <span className="polaria-text-caption text-polaria-w-50">
                ¿Por qué no?
              </span>
              <textarea
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2 polaria-text-body-sm text-polaria-w outline-none focus:border-polaria-t-20"
                placeholder="Describí la incidencia"
              />
            </label>
          ) : null}
        </section>
      ) : null}
    </PolariaFormModal>
  );
}
