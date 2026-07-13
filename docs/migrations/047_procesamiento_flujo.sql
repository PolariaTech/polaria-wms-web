-- Flujo procesamiento (frio): operario asignado + vínculo tarea ↔ solicitud
-- Aplicar en Supabase antes de probar el flujo E2E.

ALTER TABLE public.solicitud_procesamiento
  ADD COLUMN IF NOT EXISTS id_operario uuid NULL
    REFERENCES public.usuario(id_usuario)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_solicitud_procesamiento_id_operario
  ON public.solicitud_procesamiento (id_operario)
  WHERE id_operario IS NOT NULL;

ALTER TABLE public.tarea_cola
  ADD COLUMN IF NOT EXISTS id_solicitud_procesamiento uuid NULL
    REFERENCES public.solicitud_procesamiento(id_solicitud_procesamiento)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tarea_cola_id_solicitud_procesamiento
  ON public.tarea_cola (id_solicitud_procesamiento)
  WHERE id_solicitud_procesamiento IS NOT NULL;
