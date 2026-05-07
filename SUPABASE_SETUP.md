# Configuración de Supabase para Monitoring Checklist

Para aislar los datos de este proyecto de otras tablas que puedas tener, hemos creado nuevas tablas con el prefijo `monitoring_`.

## 1. Crear el Bucket de Almacenamiento

1. Ve a **Storage** en Supabase.
2. Crea un nuevo bucket llamado `inspections`.
3. Hazlo público ("Public bucket") para poder visualizar las imágenes.
4. En las políticas (Policies), permite el acceso `INSERT` y `SELECT` de forma pública o autenticada según tus necesidades.

## 2. Crear las Tablas en la Base de Datos

Ejecuta el siguiente código SQL en el **SQL Editor** de Supabase para crear las tablas necesarias específicamente para este proyecto:

```sql
-- Tabla principal de inspecciones
CREATE TABLE monitoring_inspections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  fecha date NOT NULL,
  hora time NOT NULL,
  conductor text NOT NULL,
  cargo text NOT NULL,
  patente text NOT NULL,
  kilometraje integer NOT NULL,
  marca_modelo text NOT NULL,
  anio integer NOT NULL,
  observaciones text,
  foto_frontal text,
  foto_trasera text,
  foto_lateral_der text,
  foto_lateral_izq text
);

-- Tabla de detalles de la inspección
CREATE TABLE monitoring_inspection_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  inspection_id uuid REFERENCES monitoring_inspections(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  is_good boolean NOT NULL
);

-- Índices recomendados para la búsqueda de la última patente (Kilometraje)
CREATE INDEX idx_mon_inspections_patente ON monitoring_inspections(patente);
CREATE INDEX idx_mon_inspections_created_at ON monitoring_inspections(created_at DESC);
```

## 3. Configurar Variables de Entorno

Tus variables de entorno (`.env.local`) ya han sido configuradas localmente con las claves que proporcionaste:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wjzdqcttuiixrybxoaqi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Vd8reHQz6C18PAcKvNF36g_eemMHc9p
```

## 4. Despliegue en Vercel

1. Sube tu código a GitHub.
2. Entra a Vercel, crea un nuevo proyecto e importa tu repositorio.
3. Añade las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en la configuración de Vercel.
4. Haz clic en "Deploy".
