// ============================================================
// Datos ficticios – reemplazar con llamadas a Supabase cuando
// las tablas de conductores y vehículos estén disponibles.
// ============================================================
export const MOCK_DRIVERS = [
  { nombre: "Juan Pérez",    cargo: "Operador" },
  { nombre: "María González",cargo: "Supervisora" },
  { nombre: "Carlos Soto",   cargo: "Operador" },
  { nombre: "Ana Silva",     cargo: "Jefe de Flota" },
];

export const MOCK_VEHICLES = [
  { patente: "AB1234", marcaModelo: "Toyota Hilux",     anio: "2022", lastKilometraje: 120000 },
  { patente: "CD5678", marcaModelo: "Mitsubishi L200",  anio: "2023", lastKilometraje: 45000  },
  { patente: "EF9012", marcaModelo: "Ford Ranger",      anio: "2021", lastKilometraje: 85000  },
];

// ============================================================
// Ítems que bloquean la operación (→ resultado "No Apto")
// ============================================================
export const BLOCKING_ITEMS = new Set([
  "Frenos",
  "Profundidad de dibujo (mín. reglamentario)",
  "Cinturones de seguridad (3 puntos / todos asientos)",
  "Dirección",
  "Luces de freno",
]);

// ============================================================
// Secciones ECF 4 / SIGO
// Cada ítem: { key, label, hint }
// ============================================================
export interface CheckItem {
  key: string;
  label: string;
  hint?: string; // Guía de foto al marcar "Malo"
}

export interface Section {
  id: string;
  title: string;
  icon: string;
  items: CheckItem[];
}

export const SECTIONS: Section[] = [
  {
    id: "seguridad_activa",
    title: "Estructura y Seguridad Activa",
    icon: "Shield",
    items: [
      {
        key: "jaula_antivuelco",
        label: "Jaula Antivuelco (interna/externa)",
        hint: "Fotografiar puntos de anclaje al chasis, soldaduras con grietas o deformaciones visibles.",
      },
      {
        key: "airbags",
        label: "Airbags (frontales y laterales)",
        hint: "Fotografiar el testigo (luz de advertencia) encendido en el tablero de instrumentos.",
      },
      {
        key: "cinturones",
        label: "Cinturones de seguridad (3 puntos / todos asientos)",
        hint: "Capturar el desgaste de la cinta, hebillas dañadas o indicador de pretensor activado.",
      },
      {
        key: "laminas_seguridad",
        label: "Láminas de seguridad en vidrios laterales",
        hint: "Fotografiar burbujas, desprendimientos o trizaduras que comprometan la cohesión del cristal.",
      },
      {
        key: "direccion",
        label: "Dirección",
        hint: "Capturar juego excesivo en la columna o pérdida de fluido de dirección asistida.",
      },
    ],
  },
  {
    id: "neumaticos",
    title: "Neumáticos y Tracción",
    icon: "CircleDot",
    items: [
      {
        key: "profundidad_dibujo",
        label: "Profundidad de dibujo (mín. reglamentario)",
        hint: "Capturar cortes laterales, protuberancias o profundidad del dibujo con profundímetro si es posible.",
      },
      {
        key: "presion_aire",
        label: "Presión de aire según fabricante",
        hint: "Evidencia de falta de presión (fotografiar manómetro o llanta visiblemente desinflada).",
      },
      {
        key: "indicadores_torque",
        label: "Indicadores de torque en tuercas de ruedas",
        hint: "Fotografiar la ausencia o desalineación de los indicadores plásticos de torque en las ruedas.",
      },
      {
        key: "rueda_repuesto",
        label: "Rueda de repuesto operativa",
        hint: "Evidencia de falta de presión o daños estructurales en la llanta de auxilio.",
      },
    ],
  },
  {
    id: "visibilidad",
    title: "Visibilidad y Señalización",
    icon: "Eye",
    items: [
      {
        key: "pertiga",
        label: "Pértiga con luz LED y bandera (mín. 3m)",
        hint: "Fotografiar la ampolleta/LED quemada o daños en la base de sujeción y estado de la bandera.",
      },
      {
        key: "baliza",
        label: "Baliza estroboscópica color ámbar",
        hint: "Capturar daños en el domo o evidencia visual de que no emite destellos.",
      },
      {
        key: "alarma_retroceso",
        label: "Alarma de retroceso audible",
        hint: "Indicar en la descripción si la alarma no suena al enganchar reversa.",
      },
      {
        key: "encendido_luces",
        label: "Encendido automático de luces",
        hint: "Capturar el tablero indicando que las luces no se activan automáticamente.",
      },
      {
        key: "luces_freno",
        label: "Luces de freno",
        hint: "Fotografiar la luz trasera apagada al pisar el pedal de freno.",
      },
      {
        key: "parabrisas",
        label: "Parabrisas (sin trizaduras en campo visual)",
        hint: "Primer plano de trizadura, ojo de buey o picadura en el radio de visión del conductor.",
      },
    ],
  },
  {
    id: "emergencia",
    title: "Equipos de Emergencia",
    icon: "AlertOctagon",
    items: [
      {
        key: "extintor",
        label: "Extintor de incendio (carga y sello vigente)",
        hint: "Capturar el manómetro en zona roja o el sello de seguridad roto/ausente.",
      },
      {
        key: "cunas",
        label: "Dos cuñas de seguridad",
        hint: "Evidencia de grietas en el material o tamaño inadecuado para el neumático del vehículo.",
      },
      {
        key: "botiquin",
        label: "Botiquín de primeros auxilios completo",
        hint: "Fotografía de insumos faltantes o con fecha de vencimiento expirada.",
      },
      {
        key: "triangulos",
        label: "Triángulos de emergencia",
        hint: "Capturar daños en la estructura reflectante.",
      },
      {
        key: "chaleco_reflectante",
        label: "Chaleco reflectante",
        hint: "Fotografiar deterioro de las cintas reflectantes o tallas incorrectas.",
      },
    ],
  },
  {
    id: "mecanica",
    title: "Mecánica y Fluidos",
    icon: "Wrench",
    items: [
      {
        key: "frenos",
        label: "Frenos",
        hint: "Fotografiar disco rayado, pastilla desgastada o pedal de freno sin resistencia.",
      },
      {
        key: "fugas_fluidos",
        label: "Fugas de fluidos (aceite, refrigerante, frenos)",
        hint: "Fotografiar la mancha en el suelo y el origen de la fuga en el motor o transmisión.",
      },
      {
        key: "bateria",
        label: "Batería (bornes y sujeción)",
        hint: "Capturar bornes sulfatados o falta de sujeción (soporte suelto).",
      },
      {
        key: "tablero_indicadores",
        label: "Tablero de instrumentos (sin testigos encendidos)",
        hint: "Fotografiar los testigos encendidos en el tablero de forma que sean claramente legibles.",
      },
    ],
  },
  {
    id: "gestion_vial",
    title: "Gestión Vial / Adicionales",
    icon: "Truck",
    items: [
      { 
        key: "aire_acondicionado", 
        label: "C.1 Aire acondicionado / Climatizador", 
        hint: "Verificar funcionamiento frío/calor con vidrios cerrados." 
      },
      { 
        key: "apoya_cabezas", 
        label: "C.7 Apoya-cabezas en todos los asientos", 
        hint: "Verificar que cada asiento posea su apoya-cabeza de fábrica." 
      },
      { 
        key: "bocina", 
        label: "C.11 Bocina operativa", 
        hint: "Verificar sonido audible y funcionamiento." 
      },
      { 
        key: "identificacion_logos", 
        label: "C.13 N° Identificación, Logotipos y Cintas", 
        hint: "Cinta reflectante 4-5cm, logos laterales y número visible." 
      },
      { 
        key: "gps_velocidad", 
        label: "C.14 Sistema de monitoreo GPS y Velocidad", 
        hint: "Transmisión en tiempo real (máx. 20 seg) y soporte técnico." 
      },
      { 
        key: "barrera_carga", 
        label: "C.3/C.4 Protección y Aseguramiento de Carga", 
        hint: "Certificación de malla/defensa y uso de eslingas/fajas (No nylon)." 
      },
      { 
        key: "comunicacion_radio", 
        label: "C.19/21 Radiocomunicación Bi-direccional", 
        hint: "Equipo base o radio portátil según área de operación." 
      },
      { 
        key: "equipamiento_mina", 
        label: "C.15/16/20/24/25 Equipamiento Específico Mina", 
        hint: "4x4, Diésel, Color Rojo, Foco Faenero y Cortacorriente (si aplica)." 
      },
    ],
  },
];

export const GENERAL_PHOTOS = ["Frontal", "Trasera", "Lateral Derecho", "Lateral Izquierdo"];

// ============================================================
// Pasos del Stepper
// ============================================================
export const STEPS = [
  { id: "identificacion",  label: "Identificación" },
  { id: "seguridad_activa",label: "Seguridad Activa" },
  { id: "neumaticos",      label: "Neumáticos" },
  { id: "visibilidad",     label: "Señalización" },
  { id: "emergencia",      label: "Emergencia" },
  { id: "mecanica",        label: "Mecánica" },
  { id: "gestion_vial",    label: "Gestión Vial" },
  { id: "fotos",           label: "Fotos Generales" },
  { id: "cierre",          label: "Cierre y Firma" },
];
