-- Permite registrar merma de procesamiento en movimiento_inventario.
-- Requerido tras POST /procesamiento/solicitudes/:id/cerrar (tipo_referencia = solicitud_procesamiento).

ALTER TABLE public.movimiento_inventario
  DROP CONSTRAINT IF EXISTS chk_movimiento_tipo_referencia;

ALTER TABLE public.movimiento_inventario
  ADD CONSTRAINT chk_movimiento_tipo_referencia
  CHECK (
    tipo_referencia IS NULL
    OR tipo_referencia IN (
      'orden_compra',
      'orden_trabajo',
      'orden_venta',
      'solicitud_compra',
      'solicitud_procesamiento',
      'manual'
    )
  );
