import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, CheckCircle, AlertTriangle, Send, UploadCloud, FileText, Check } from 'lucide-react';

// Definitions
const SECTIONS = {
  exterior: [
    'Carrocería',
    'Parachoques Delantero',
    'Parachoques Trasero',
    'Espejos',
    'Parabrisas',
    'Limpia parabrisas',
    'Neumáticos Estado',
    'Neumáticos Presión',
    'Neumáticos Repuesto',
    'Llave de rueda',
    'Gata'
  ],
  luces: [
    'Bajas',
    'Altas',
    'Freno',
    'Intermitentes',
    'Retroceso',
    'Baliza',
    'Pértiga'
  ],
  interior: [
    'Cinturones',
    'Bocina',
    'Tablero',
    'Indicadores',
    'Aire acondicionado',
    'Asientos',
    'Frenos'
  ],
  seguridad: [
    'Extintor',
    'Botiquín',
    'Triángulos',
    'Chaleco reflectante',
    'Cuñas'
  ]
};

const PHOTOS = ['Frontal', 'Trasera', 'Lateral Derecho', 'Lateral Izquierdo'];

// Datos ficticios para pruebas (luego se leerán de la BD)
const MOCK_DRIVERS = ["Juan Pérez", "María González", "Carlos Soto", "Ana Silva"];
const MOCK_VEHICLES = [
  { patente: "AB1234", marcaModelo: "Toyota Hilux", anio: "2022", lastKilometraje: 120000 },
  { patente: "CD5678", marcaModelo: "Mitsubishi L200", anio: "2023", lastKilometraje: 45000 },
  { patente: "EF9012", marcaModelo: "Ford Ranger", anio: "2021", lastKilometraje: 85000 }
];

type InspectionState = Record<string, boolean | null>;

export default function ChecklistForm() {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
    conductor: '',
    cargo: '',
    patente: '',
    kilometraje: '',
    marcaModelo: '',
    anio: '',
    observaciones: ''
  });

  const [aceptoEnvio, setAceptoEnvio] = useState(false);

  const [inspection, setInspection] = useState<InspectionState>(() => {
    const initialState: InspectionState = {};
    Object.values(SECTIONS).flat().forEach(item => {
      initialState[item] = null;
    });
    return initialState;
  });

  const [photos, setPhotos] = useState<Record<string, File | null>>({
    'Frontal': null,
    'Trasera': null,
    'Lateral Derecho': null,
    'Lateral Izquierdo': null
  });

  const [lastKilometraje, setLastKilometraje] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Al cambiar la patente desde el select, se actualizan los datos relacionados (ficticios por ahora)
  useEffect(() => {
    const vehiculo = MOCK_VEHICLES.find(v => v.patente === formData.patente);
    if (vehiculo) {
      setFormData(prev => ({
        ...prev,
        marcaModelo: vehiculo.marcaModelo,
        anio: vehiculo.anio
      }));
      setLastKilometraje(vehiculo.lastKilometraje);
    } else {
      setFormData(prev => ({ ...prev, marcaModelo: '', anio: '' }));
      setLastKilometraje(null);
    }
  }, [formData.patente]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInspectionChange = (item: string, value: boolean) => {
    setInspection(prev => ({ ...prev, [item]: value }));
  };

  const handlePhotoUpload = (item: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotos(prev => ({ ...prev, [item]: e.target.files![0] }));
    }
  };

  const currentKilometraje = Number(formData.kilometraje);
  const isKilometrajeValid = !formData.kilometraje || lastKilometraje === null || currentKilometraje > lastKilometraje;
  
  // Calcular faltantes
  const missingHeaderFields = Object.entries(formData)
    .filter(([key, val]) => ['conductor', 'cargo', 'patente', 'kilometraje'].includes(key) && !val)
    .map(([key]) => key);
  
  const missingInspectionItems = Object.entries(inspection)
    .filter(([_, val]) => val === null)
    .map(([key]) => key);

  const missingPhotos = Object.entries(photos)
    .filter(([_, val]) => val === null)
    .map(([key]) => key);

  // El formulario es válido si: no faltan campos de cabecera, ni inspecciones, ni fotos obligatorias,
  // el kilometraje es válido Y se marcó el check de aceptación.
  const isFormValid = missingHeaderFields.length === 0 && 
                      missingInspectionItems.length === 0 && 
                      missingPhotos.length === 0 && 
                      isKilometrajeValid && 
                      aceptoEnvio;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Upload Photos
      const photoUrls: Record<string, string> = {};
      
      for (const [key, file] of Object.entries(photos)) {
        if (file) {
          const fileName = `${formData.patente}-${Date.now()}-${key.replace(' ', '')}`;
          const { data, error } = await supabase.storage
            .from('inspections')
            .upload(`photos/${fileName}`, file);
            
          if (error) {
            console.warn("Storage error, using mock URL", error);
            photoUrls[key] = `mock-url-${fileName}`;
          } else {
            const { data: urlData } = supabase.storage
              .from('inspections')
              .getPublicUrl(`photos/${fileName}`);
            photoUrls[key] = urlData.publicUrl;
          }
        }
      }

      // 2. Insert Inspection
      const { data: insData, error: insError } = await supabase
        .from('monitoring_inspections')
        .insert([{
          fecha: formData.fecha,
          hora: formData.hora,
          conductor: formData.conductor,
          cargo: formData.cargo,
          patente: formData.patente,
          kilometraje: currentKilometraje,
          marca_modelo: formData.marcaModelo,
          anio: Number(formData.anio),
          observaciones: formData.observaciones,
          foto_frontal: photoUrls['Frontal'],
          foto_trasera: photoUrls['Trasera'],
          foto_lateral_der: photoUrls['Lateral Derecho'],
          foto_lateral_izq: photoUrls['Lateral Izquierdo']
        }])
        .select()
        .single();

      if (insError) {
        console.warn("DB insert error:", insError);
      }

      // 3. Insert Results
      const inspectionId = insData?.id || Date.now();
      
      const resultsToInsert = Object.entries(inspection).map(([item, isGood]) => ({
        inspection_id: inspectionId,
        item_name: item,
        is_good: isGood
      }));

      const { error: resError } = await supabase
        .from('monitoring_inspection_results')
        .insert(resultsToInsert);

      if (resError) {
        console.warn("DB details insert error:", resError);
      }

      // Success Reset
      setStatusMessage({ type: 'success', text: 'Inspección enviada correctamente.' });
      
      // Reset form
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
        conductor: '',
        cargo: '',
        patente: '',
        kilometraje: '',
        marcaModelo: '',
        anio: '',
        observaciones: ''
      });
      setAceptoEnvio(false);
      
      const resetInspection: InspectionState = {};
      Object.keys(inspection).forEach(k => resetInspection[k] = null);
      setInspection(resetInspection);
      
      const resetPhotos: any = {};
      PHOTOS.forEach(p => resetPhotos[p] = null);
      setPhotos(resetPhotos);
      
      window.scrollTo(0, 0);

    } catch (error) {
      console.error(error);
      setStatusMessage({ type: 'error', text: 'Ocurrió un error al enviar el formulario.' });
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (title: string, items: string[]) => (
    <div className="card" key={title}>
      <h2 className="card-title">
        <CheckCircle className="text-[var(--color-primary)]" />
        {title}
        {items.filter(i => inspection[i] === null).length > 0 && (
          <span className="missing-badge">{items.filter(i => inspection[i] === null).length} faltantes</span>
        )}
      </h2>
      <div className="grid">
        {items.map(item => (
          <div key={item} className="checklist-item">
            <span className="checklist-item-title">{item}</span>
            <div className="checklist-item-controls">
              <div className="radio-group">
                <input 
                  type="radio" 
                  id={`${item}-good`}
                  name={item} 
                  className="radio-input"
                  checked={inspection[item] === true}
                  onChange={() => handleInspectionChange(item, true)}
                />
                <label htmlFor={`${item}-good`} className="radio-label good">
                  Bueno
                </label>
                
                <input 
                  type="radio" 
                  id={`${item}-bad`}
                  name={item} 
                  className="radio-input"
                  checked={inspection[item] === false}
                  onChange={() => handleInspectionChange(item, false)}
                />
                <label htmlFor={`${item}-bad`} className="radio-label bad">
                  Malo
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="header-banner">
        <h1 className="header-title">Monitoring</h1>
        <p className="header-subtitle">Gestión de Activos - Inspección Técnica</p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '4rem' }}>
        
        {statusMessage && (
          <div className={`alert alert-${statusMessage.type}`}>
            {statusMessage.type === 'success' ? <CheckCircle /> : <AlertTriangle />}
            {statusMessage.text}
          </div>
        )}

        <div className="card">
          <h2 className="card-title">
            <FileText className="text-[var(--color-primary)]" />
            Identificación
          </h2>
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Hora</label>
              <input type="time" name="hora" value={formData.hora} onChange={handleInputChange} required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Conductor</label>
              <select name="conductor" value={formData.conductor} onChange={handleInputChange} required>
                <option value="">Seleccione un conductor...</option>
                {MOCK_DRIVERS.map(driver => (
                  <option key={driver} value={driver}>{driver}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Cargo</label>
              <input type="text" name="cargo" value={formData.cargo} onChange={handleInputChange} placeholder="Cargo del conductor" required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Vehículo (Patente)</label>
              <select name="patente" value={formData.patente} onChange={handleInputChange} required>
                <option value="">Seleccione vehículo...</option>
                {MOCK_VEHICLES.map(v => (
                  <option key={v.patente} value={v.patente}>{v.patente} - {v.marcaModelo}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Kilometraje
                {lastKilometraje !== null && <span style={{fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '10px'}}>(Último: {lastKilometraje})</span>}
              </label>
              <input 
                type="number" 
                name="kilometraje" 
                value={formData.kilometraje} 
                onChange={handleInputChange} 
                placeholder="Ej. 120000"
                className={!isKilometrajeValid ? 'is-invalid' : ''}
                required 
              />
              {!isKilometrajeValid && formData.kilometraje && (
                <span className="invalid-feedback">El kilometraje debe ser mayor a {lastKilometraje}.</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Marca/Modelo</label>
              <input type="text" name="marcaModelo" value={formData.marcaModelo} readOnly placeholder="Autocompletado" style={{ backgroundColor: 'var(--color-background)' }} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Año</label>
              <input type="number" name="anio" value={formData.anio} readOnly placeholder="Autocompletado" style={{ backgroundColor: 'var(--color-background)' }} />
            </div>
          </div>
        </div>

        {renderSection('Exterior', SECTIONS.exterior)}
        {renderSection('Luces', SECTIONS.luces)}
        {renderSection('Interior', SECTIONS.interior)}
        {renderSection('Seguridad', SECTIONS.seguridad)}

        <div className="card">
          <h2 className="card-title">
            <Camera className="text-[var(--color-primary)]" />
            Registro Fotográfico
            {missingPhotos.length > 0 && (
              <span className="missing-badge">{missingPhotos.length} faltantes</span>
            )}
          </h2>
          <div className="file-upload-grid">
            {PHOTOS.map(photo => (
              <label key={photo} className={`file-upload-card ${photos[photo] ? 'has-file' : ''}`}>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="file-input" 
                  onChange={(e) => handlePhotoUpload(photo, e)}
                />
                {photos[photo] ? (
                  <>
                    <CheckCircle className="file-icon" size={32} />
                    <span className="file-label" style={{color: 'var(--color-success)'}}>{photo} cargada</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="file-icon" size={32} />
                    <span className="file-label">Foto {photo}</span>
                    <span style={{fontSize: '0.8rem', color: 'var(--color-support)', marginTop: '0.5rem'}}>Obligatorio</span>
                  </>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <Check className="text-[var(--color-primary)]" />
            Cierre de Inspección
          </h2>
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label className="form-label">Observaciones Generales (Opcional)</label>
            <textarea 
              name="observaciones" 
              value={formData.observaciones} 
              onChange={handleInputChange} 
              rows={4}
              placeholder="Detalle cualquier problema encontrado o información adicional..."
            />
          </div>
        </div>

        <div className="card" style={{ background: 'transparent', boxShadow: 'none', padding: '0', border: 'none' }}>
          
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <input 
              type="checkbox" 
              id="acepto-envio"
              checked={aceptoEnvio}
              onChange={(e) => setAceptoEnvio(e.target.checked)}
              style={{ width: 'auto', transform: 'scale(1.3)', cursor: 'pointer' }}
            />
            <label htmlFor="acepto-envio" style={{ cursor: 'pointer', fontWeight: 500, color: 'var(--color-primary-dark)' }}>
              Acepto el envío de esta inspección y declaro que los datos son verídicos.
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-action" 
            style={{ width: '100%', fontSize: '1.25rem', padding: '1rem' }}
            disabled={!isFormValid || loading}
          >
            {loading ? 'Enviando...' : (
              <>
                <Send size={24} />
                Enviar Inspección
              </>
            )}
          </button>
          
          {!isFormValid && (
            <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--color-danger)', fontSize: '0.9rem' }}>
              Debe completar los campos, marcar todas las opciones, subir las 4 fotos y marcar la casilla de aceptación.
            </div>
          )}
        </div>

      </form>
    </div>
  );
}
