-- ============================================================
-- Ejecutar en Supabase SQL Editor (proyecto compartido)
-- Despliegue seguro: combustible + bases RLS (revisar impacto)
-- ============================================================

-- 1) Columna de combustible (requerida para el checklist actual)
ALTER TABLE public.monitoring_inspections
  ADD COLUMN IF NOT EXISTS nivel_combustible text;

ALTER TABLE public.monitoring_inspections
  DROP CONSTRAINT IF EXISTS monitoring_inspections_nivel_combustible_check;

ALTER TABLE public.monitoring_inspections
  ADD CONSTRAINT monitoring_inspections_nivel_combustible_check
  CHECK (
    nivel_combustible IS NULL
    OR nivel_combustible IN ('1/8', '1/4', '1/2', '3/4', 'FULL')
  );

COMMENT ON COLUMN public.monitoring_inspections.nivel_combustible IS
  'Marcador de combustible opcional: 1/8, 1/4, 1/2, 3/4, FULL';

-- 2) Admins whitelist (AJUSTAR RUT/email reales antes de ejecutar)
-- INSERT INTO public.control_vehiculos_admins (rut, email, nombre, activo)
-- VALUES ('12.345.678-9', 'tu.usuario@monitoring.cl', 'Admin Monitoring', true)
-- ON CONFLICT DO NOTHING;

-- NOTA: No ejecutes todavía security.sql / admin-security.sql (cierres RLS)
-- sobre el checklist legacy sin migrar a RPCs de monitoring-check-campo,
-- o los inserts del formulario actual dejarán de funcionar.
