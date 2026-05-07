# Configuración de Supabase — Monitoring Checklist (ECF 4)

## 1. Buckets de Storage

Crea **dos** buckets en Supabase → Storage:

| Bucket            | Tipo    | Uso                                               |
|-------------------|---------|---------------------------------------------------|
| `vehicle-photos`  | Público | Fotos generales, hallazgos y firmas digitales     |

Activa acceso público (`Public bucket`) y permite INSERT + SELECT.

---

## 2. SQL — Crear Tablas

Ejecuta en **SQL Editor** de Supabase:

```sql
-- ─── Tabla principal de inspecciones ──────────────────────────────────────────
CREATE TABLE monitoring_inspections (
  id            uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  fecha         date    NOT NULL,
  hora          time    NOT NULL,
  conductor     text    NOT NULL,
  cargo         text    NOT NULL,
  patente       text    NOT NULL,
  kilometraje   integer NOT NULL,
  marca_modelo  text    NOT NULL,
  anio          integer NOT NULL,
  resultado     text    NOT NULL, -- 'Vehículo Apto' | 'Vehículo No Apto para Operar'
  observaciones text,
  firma_url     text,             -- URL del PNG de la firma digital
  foto_frontal      text,
  foto_trasera      text,
  foto_lateral_der  text,
  foto_lateral_izq  text
);

-- ─── Tabla de detalles por ítem (ECF 4 / SIGO) ────────────────────────────────
CREATE TABLE monitoring_inspection_details (
  id            uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  inspection_id uuid    REFERENCES monitoring_inspections(id) ON DELETE CASCADE NOT NULL,
  seccion       text    NOT NULL,    -- Nombre de la sección (p.ej. "Neumáticos y Tracción")
  item_key      text    NOT NULL,    -- Key programático del ítem
  item_label    text    NOT NULL,    -- Descripción legible del ítem
  is_good       boolean NOT NULL,   -- true = Bueno, false = Malo
  descripcion   text,               -- Obligatorio si is_good = false
  foto_url      text,               -- URL de la foto del hallazgo (Obligatorio si is_good = false)
  geotag        text,               -- Coordenadas GPS + timestamp
  is_blocking   boolean DEFAULT false -- true = ítem bloqueante (Frenos, Cinturones, etc.)
);

-- ─── Índices para rendimiento ─────────────────────────────────────────────────
CREATE INDEX idx_mon_insp_patente    ON monitoring_inspections(patente);
CREATE INDEX idx_mon_insp_created    ON monitoring_inspections(created_at DESC);
CREATE INDEX idx_mon_det_insp_id     ON monitoring_inspection_details(inspection_id);
CREATE INDEX idx_mon_det_is_good     ON monitoring_inspection_details(is_good);
```

---

## 3. Variables de Entorno (`.env.local`)

Ya configuradas en el proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wjzdqcttuiixrybxoaqi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Vd8reHQz6C18PAcKvNF36g_eemMHc9p
```

---

## 4. Ítems Bloqueantes (→ "Vehículo No Apto")

Si cualquiera de estos ítems se marca como **Malo**, el resultado final cambia automáticamente a *"Vehículo No Apto para Operar"*:

- Frenos
- Profundidad de dibujo (mín. reglamentario)
- Cinturones de seguridad (3 puntos / todos asientos)
- Dirección
- Luces de freno

---

## 5. Despliegue en Vercel

1. Sube el código al repositorio GitHub `Pedro-IA-Netxtrust/monitoring-checklist`.
2. Importa el proyecto en Vercel.
3. Agrega las variables de entorno en **Settings → Environment Variables**.
4. Deploy.
