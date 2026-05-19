-- ─── Script de Migración / Actualización para Responsables ─────────────────────

-- 1. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS inspectors (
  id            uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  nombre        text    NOT NULL,
  cargo         text    NOT NULL,
  rut           text    UNIQUE NOT NULL,
  telefono      text,
  tipo_usuario  text    DEFAULT 'Normal' CHECK (tipo_usuario IN ('Admin', 'Normal')),
  vencimiento_licencia_municipal date,
  vencimiento_licencia_interna   date,
  is_active     boolean DEFAULT true
);

-- 2. Agregar columnas si la tabla ya existía pero le faltaban campos (Safe Update)
DO $$ 
BEGIN
  -- Agregar RUT si no existe (y hacerlo NOT NULL)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspectors' AND column_name='rut') THEN
    ALTER TABLE inspectors ADD COLUMN rut text UNIQUE;
    UPDATE inspectors SET rut = '0-0' WHERE rut IS NULL; -- Valor temporal
    ALTER TABLE inspectors ALTER COLUMN rut SET NOT NULL;
  END IF;

  -- Agregar Telefono si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspectors' AND column_name='telefono') THEN
    ALTER TABLE inspectors ADD COLUMN telefono text;
  END IF;

  -- Agregar Vencimientos de Licencia
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspectors' AND column_name='vencimiento_licencia_municipal') THEN
    ALTER TABLE inspectors ADD COLUMN vencimiento_licencia_municipal date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspectors' AND column_name='vencimiento_licencia_interna') THEN
    ALTER TABLE inspectors ADD COLUMN vencimiento_licencia_interna date;
  END IF;
END $$;

-- 3. Habilitar RLS (Si no estaba habilitado)
ALTER TABLE inspectors ENABLE ROW LEVEL SECURITY;

-- 4. Crear Política (Solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inspectors' AND policyname = 'Allow all for anon'
    ) THEN
        CREATE POLICY "Allow all for anon" ON inspectors FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 5. Índices (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_inspectors_nombre ON inspectors(nombre);
CREATE INDEX IF NOT EXISTS idx_inspectors_rut ON inspectors(rut);
CREATE INDEX IF NOT EXISTS idx_inspectors_active ON inspectors(is_active);

-- 6. Renombrar columna en tabla de inspecciones (Safe Rename)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monitoring_inspections' AND column_name='conductor') THEN
    ALTER TABLE monitoring_inspections RENAME COLUMN conductor TO responsable_inspeccion;
  END IF;
END $$;
