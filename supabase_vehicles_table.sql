-- ─── Tabla de Vehículos (Flota) ──────────────────────────────────────────
CREATE TABLE vehicles (
  id            uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  patente       text    UNIQUE NOT NULL,
  marca         text    NOT NULL,
  modelo        text    NOT NULL,
  anio          integer NOT NULL,
  km_actual     integer DEFAULT 0,
  is_active     boolean DEFAULT true,
  last_inspection_at timestamptz,
  -- Nuevos campos
  fecha_revision_tecnica      date NOT NULL,
  proveedor_arriendo          text NOT NULL,
  certificado_torque_ruedas   text,
  certificado_gps             text,
  contrato_pertenece          text,
  vencimiento_seguro          date,
  vencimiento_permiso         date
);

-- Habilitar RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Políticas simples para desarrollo (Permitir todo a anon por ahora)
CREATE POLICY "Allow all for anon" ON vehicles FOR ALL USING (true) WITH CHECK (true);

-- Índices
CREATE INDEX idx_vehicles_patente ON vehicles(patente);
CREATE INDEX idx_vehicles_active  ON vehicles(is_active);

-- Insertar algunos datos de prueba (opcional)
-- INSERT INTO vehicles (patente, marca, modelo, anio, km_actual) VALUES 
-- ('ABCD-12', 'Toyota', 'Hilux', 2023, 15000),
-- ('XYZA-34', 'Mitsubishi', 'L200', 2022, 45000);
