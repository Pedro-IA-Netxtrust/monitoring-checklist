'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, CircleDot, Eye, AlertOctagon, Wrench, Truck,
  Camera, CheckCircle, AlertTriangle, Send, UploadCloud,
  FileText, ChevronRight, ChevronLeft, Check, XCircle, MapPin
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  SECTIONS, GENERAL_PHOTOS, STEPS, BLOCKING_ITEMS, FUEL_LEVELS,
  MOCK_DRIVERS, MOCK_VEHICLES, type CheckItem, type FuelLevel,
} from '@/lib/checklistData';
import SignatureCanvas from '@/components/SignatureCanvas';
import FaultPhoto from '@/components/FaultPhoto';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
interface ItemState {
  value: boolean | null;
  descripcion: string;
  fotoFile: File | null;
  fotoGeo: string;
}

type InspectionMap = Record<string, ItemState>;

const sectionIcon = (id: string) => {
  const map: Record<string, React.ReactNode> = {
    seguridad_activa: <Shield size={22} />,
    neumaticos:       <CircleDot size={22} />,
    visibilidad:      <Eye size={22} />,
    emergencia:       <AlertOctagon size={22} />,
    mecanica:         <Wrench size={22} />,
    gestion_vial:     <Truck size={22} />,
  };
  return map[id] ?? <CheckCircle size={22} />;
};

// ──────────────────────────────────────────────────────────
// Initial state builder
// ──────────────────────────────────────────────────────────
function buildInitialInspection(): InspectionMap {
  const map: InspectionMap = {};
  SECTIONS.forEach(section =>
    section.items.forEach(item => {
      map[item.key] = { value: null, descripcion: '', fotoFile: null, fotoGeo: '' };
    })
  );
  return map;
}

// ──────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────
export default function ChecklistForm() {
  // Header data
  const [formData, setFormData] = useState({
    fecha:       new Date().toISOString().split('T')[0],
    hora:        new Date().toTimeString().substring(0, 5),
    responsable: '',
    cargo:       '',
    patente:     '',
    kilometraje: '',
    marcaModelo: '',
    anio:        '',
    observaciones: '',
  });
  const [nivelCombustible, setNivelCombustible] = useState<FuelLevel | ''>('');

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [lastKilometraje, setLastKilometraje] = useState<number | null>(null);
  const [inspection, setInspection] = useState<InspectionMap>(buildInitialInspection);
  const [generalPhotos, setGeneralPhotos] = useState<Record<string, File | null>>(() => {
    const m: Record<string, File | null> = {};
    GENERAL_PHOTOS.forEach(p => (m[p] = null));
    return m;
  });
  const [signature, setSignature] = useState<string | null>(null);
  const [aceptoEnvio, setAceptoEnvio] = useState(false);
  const [includeGestionVial, setIncludeGestionVial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Derived steps based on toggle
  const activeSteps = STEPS.filter(s => s.id !== 'gestion_vial' || includeGestionVial);
  const activeSections = SECTIONS.filter(s => s.id !== 'gestion_vial' || includeGestionVial);

  // ── Fetch Vehicles from DB ──────────────────────────────
  useEffect(() => {
    async function fetchInitialData() {
      const { data: vData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('patente', { ascending: true });
      
      if (vData) setVehicles(vData);

      const { data: iData } = await supabase
        .from('inspectors')
        .select('*')
        .eq('is_active', true)
        .order('nombre', { ascending: true });
      
      if (iData) setInspectors(iData);
    }
    fetchInitialData();
  }, []);

  // ── Autocomplete vehículo ──────────────────────────────
  useEffect(() => {
    const v = vehicles.find(v => v.patente === formData.patente);
    if (v) {
      setFormData(p => ({ ...p, marcaModelo: `${v.marca} ${v.modelo}`, anio: v.anio.toString() }));
      setLastKilometraje(v.km_actual);
      setSelectedVehicle(v);
    } else {
      setFormData(p => ({ ...p, marcaModelo: '', anio: '' }));
      setLastKilometraje(null);
      setSelectedVehicle(null);
    }
  }, [formData.patente, vehicles]);

  // ── Autocomplete cargo responsable ───────────────────
  useEffect(() => {
    const i = inspectors.find(i => i.nombre === formData.responsable);
    if (i) setFormData(p => ({ ...p, cargo: i.cargo }));
  }, [formData.responsable, inspectors]);

  // ── Computed values ──────────────────────────────────
  const currentKm     = Number(formData.kilometraje);
  const isKmValid     = !formData.kilometraje || lastKilometraje === null || currentKm > lastKilometraje;

  const hasBadBlocking = SECTIONS.flatMap(s => s.items)
    .filter(i => BLOCKING_ITEMS.has(i.label))
    .some(i => inspection[i.key]?.value === false);

  const resultadoFinal = hasBadBlocking ? 'Vehículo No Apto para Operar' : 'Vehículo Apto';

  // Items with Malo but missing description or photo
  const incompleteItems = Object.entries(inspection)
    .filter(([_, s]) => s.value === false && (!s.descripcion.trim() || !s.fotoFile))
    .map(([k]) => k);

  const stepComplete = useCallback((stepIdx: number): boolean => {
    const step = activeSteps[stepIdx];
    if (!step) return true;
    if (step.id === 'identificacion') {
      return !!(formData.responsable && formData.cargo && formData.patente &&
                formData.kilometraje && isKmValid && formData.marcaModelo);
    }
    // Fotos generales opcionales (0–4)
    if (step.id === 'fotos') return true;
    if (step.id === 'cierre') return !!signature && aceptoEnvio;
    // Checklist section
    const sec = SECTIONS.find(s => s.id === step.id);
    if (!sec) return true;
    return sec.items.every(i => {
      const st = inspection[i.key];
      if (st.value === null) return false;
      if (st.value === false) return !!(st.descripcion.trim() && st.fotoFile);
      return true;
    });
  }, [formData, isKmValid, inspection, signature, aceptoEnvio, activeSteps]);

  const allComplete = activeSteps.every((_, i) => stepComplete(i));

  // ── Handlers ─────────────────────────────────────────
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const setItemValue = (key: string, value: boolean) => {
    setInspection(p => ({ ...p, [key]: { ...p[key], value } }));
  };

  const setItemDesc = (key: string, descripcion: string) => {
    setInspection(p => ({ ...p, [key]: { ...p[key], descripcion } }));
  };

  const setItemPhoto = (key: string, fotoFile: File | null, fotoGeo: string) => {
    setInspection(p => ({ ...p, [key]: { ...p[key], fotoFile, fotoGeo } }));
  };

  const handleGenPhoto = (label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setGeneralPhotos(p => ({ ...p, [label]: file }));
  };

  // ── Upload helper ─────────────────────────────────────
  const uploadFile = async (bucket: string, path: string, file: File): Promise<string> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return `mock://${path}`;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allComplete) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const ts = Date.now();

      // 1. Upload general photos
      const genUrls: Record<string, string> = {};
      for (const [label, file] of Object.entries(generalPhotos)) {
        if (file) {
          genUrls[label] = await uploadFile(
            'vehicle-photos',
            `general/${formData.patente}-${ts}-${label.replace(/ /g, '')}.jpg`,
            file
          );
        }
      }

      // 2. Upload signature
      let firmaUrl = '';
      if (signature) {
        const blob = await (await fetch(signature)).blob();
        const sigFile = new File([blob], 'firma.png', { type: 'image/png' });
        firmaUrl = await uploadFile('vehicle-photos', `firmas/${formData.patente}-${ts}-firma.png`, sigFile);
      }

      // 3. Insert inspection header
      const { data: insData, error: insErr } = await supabase
        .from('monitoring_inspections')
        .insert([{
          fecha:          formData.fecha,
          hora:           formData.hora,
          responsable_inspeccion: formData.responsable,
          cargo:          formData.cargo,
          patente:        formData.patente,
          kilometraje:    currentKm,
          marca_modelo:   formData.marcaModelo,
          anio:           Number(formData.anio),
          observaciones:  formData.observaciones,
          resultado:      resultadoFinal,
          firma_url:      firmaUrl,
          foto_frontal:   genUrls['Frontal']        ?? null,
          foto_trasera:   genUrls['Trasera']         ?? null,
          foto_lateral_der: genUrls['Lateral Derecho'] ?? null,
          foto_lateral_izq: genUrls['Lateral Izquierdo'] ?? null,
          nivel_combustible: nivelCombustible || null,
        }])
        .select()
        .single();

      if (insErr) console.warn('Header insert error:', insErr);

      const inspId = insData?.id ?? ts;

      // 4. Upload fault photos and build details rows
      const detailRows = [];
      for (const section of activeSections) {
        for (const item of section.items) {
          const st = inspection[item.key];
          let fotoUrl: string | null = null;
          if (st.fotoFile) {
            fotoUrl = await uploadFile(
              'vehicle-photos',
              `hallazgos/${formData.patente}-${ts}-${item.key}.jpg`,
              st.fotoFile
            );
          }
          detailRows.push({
            inspection_id: inspId,
            seccion:       section.title,
            item_key:      item.key,
            item_label:    item.label,
            is_good:       st.value,
            descripcion:   st.descripcion || null,
            foto_url:      fotoUrl,
            geotag:        st.fotoGeo || null,
            is_blocking:   BLOCKING_ITEMS.has(item.label),
          });
        }
      }

      const { error: detErr } = await supabase
        .from('monitoring_inspection_details')
        .insert(detailRows);

      if (detErr) console.warn('Details insert error:', detErr);

      // 5. Update vehicle mileage
      const { error: vehErr } = await supabase
        .from('vehicles')
        .update({ km_actual: currentKm })
        .eq('patente', formData.patente);
      
      if (vehErr) console.warn('Vehicle KM update error:', vehErr);

      setStatusMessage({ type: 'success', text: `Inspección enviada. Resultado: ${resultadoFinal}` });
      resetForm();
      window.scrollTo(0, 0);

    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Error al enviar. Verifica tu conexión.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fecha:       new Date().toISOString().split('T')[0],
      hora:        new Date().toTimeString().substring(0, 5),
      responsable: '', cargo: '', patente: '', kilometraje: '',
      marcaModelo: '', anio: '', observaciones: '',
    });
    setInspection(buildInitialInspection());
    const reset: Record<string, File | null> = {};
    GENERAL_PHOTOS.forEach(p => (reset[p] = null));
    setGeneralPhotos(reset);
    setSignature(null);
    setAceptoEnvio(false);
    setNivelCombustible('');
    setCurrentStep(0);
    setIncludeGestionVial(false);
  };

  // ── Step renderers ────────────────────────────────────
  const renderIdentification = () => (
    <div className="step-body">
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input type="date" name="fecha" value={formData.fecha} onChange={handleInput} required />
        </div>
        <div className="form-group">
          <label className="form-label">Hora</label>
          <input type="time" name="hora" value={formData.hora} onChange={handleInput} required />
        </div>
        <div className="form-group">
          <label className="form-label">Responsable de Inspección</label>
          <select name="responsable" value={formData.responsable} onChange={handleInput} required>
            <option value="">Seleccione responsable…</option>
            {inspectors.map(i => (
              <option key={i.id} value={i.nombre}>{i.nombre} ({i.rut})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Cargo</label>
          <input type="text" name="cargo" value={formData.cargo} onChange={handleInput}
            placeholder="Cargo del conductor" required />
        </div>
        <div className="form-group">
          <label className="form-label">Vehículo (Patente)</label>
          <select name="patente" value={formData.patente} onChange={handleInput} required>
            <option value="">Seleccione vehículo…</option>
            {vehicles.map(v => (
              <option key={v.patente} value={v.patente}>{v.patente} — {v.marca} {v.modelo}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">
            Kilometraje
            {lastKilometraje !== null && (
              <span className="label-hint">Último registrado: {lastKilometraje.toLocaleString()}</span>
            )}
          </label>
          <input type="number" name="kilometraje" value={formData.kilometraje} onChange={handleInput}
            placeholder="Ej. 125000" className={!isKmValid ? 'is-invalid' : ''} required />
          {!isKmValid && formData.kilometraje && (
            <span className="invalid-feedback">Debe ser mayor a {lastKilometraje?.toLocaleString()}.</span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Marca / Modelo</label>
          <input type="text" value={formData.marcaModelo} readOnly
            placeholder="Autocompletado al elegir patente" className="input-readonly" />
        </div>
        <div className="form-group">
          <label className="form-label">Año</label>
          <input type="text" value={formData.anio} readOnly
            placeholder="Autocompletado al elegir patente" className="input-readonly" />
        </div>
      </div>

      <div className="form-group full-width">
        <label className="form-label">
          Nivel de combustible
          <span className="label-hint">Opcional</span>
        </label>
        <div className="fuel-level-btns" role="group" aria-label="Nivel de combustible">
          {FUEL_LEVELS.map(level => (
            <button
              key={level}
              type="button"
              className={`fuel-level-btn ${nivelCombustible === level ? 'active' : ''}`}
              onClick={() => setNivelCombustible(prev => (prev === level ? '' : level))}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group full-width">
          <div className="gestion-vial-toggle-card">
            <div className="toggle-info">
              <Truck size={24} className="text-primary" />
              <div>
                <strong>Inspección de Gestión Vial</strong>
                <p>Marcar si requiere verificar requisitos adicionales (Aire ac., carga, GPS, etc.)</p>
              </div>
            </div>
            <div className="toggle-switch">
              <input 
                type="checkbox" 
                id="gv-toggle" 
                checked={includeGestionVial} 
                onChange={e => setIncludeGestionVial(e.target.checked)} 
              />
              <label htmlFor="gv-toggle"></label>
            </div>
          </div>
  
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .gestion-vial-toggle-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem;
          background: #f0f7ff;
          border: 1px solid #c2e0ff;
          border-radius: 1rem;
          margin-top: 1rem;
        }
        .toggle-info { display: flex; gap: 1rem; align-items: center; }
        .toggle-info p { margin: 0; font-size: 0.85rem; color: #4b5563; }
        .toggle-info strong { color: #1e40af; }
        
        .toggle-switch { position: relative; width: 50px; height: 26px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-switch label {
          position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
          background-color: #cbd5e1; transition: .4s; border-radius: 34px;
        }
        .toggle-switch label:before {
          position: absolute; content: ""; height: 18px; width: 18px; left: 4px; bottom: 4px;
          background-color: white; transition: .4s; border-radius: 50%;
        }
        .toggle-switch input:checked + label { background-color: var(--primary); }
        .toggle-switch input:checked + label:before { transform: translateX(24px); }
      ` }} />
    </div>
  );

  const renderCheckSection = (sectionId: string) => {
    const sec = SECTIONS.find(s => s.id === sectionId);
    if (!sec) return null;
    return (
      <div className="step-body">
        {sec.items.map(item => {
          const st = inspection[item.key];
          const isBad   = st.value === false;
          const isGood  = st.value === true;
          const isBlock = BLOCKING_ITEMS.has(item.label);
          const needsEvidence = isBad && (!st.descripcion.trim() || !st.fotoFile);
          return (
            <div
              key={item.key}
              className={`check-row ${isBad ? 'check-row--bad' : ''} ${isBlock && isBad ? 'check-row--blocking' : ''}`}
            >
              <div className="check-row-header">
                <div className="check-row-title">
                  {isBlock && <span className="blocking-badge">⚠ Bloqueante</span>}
                  <span>{item.label}</span>
                </div>
                <div className="binary-btns">
                  <button
                    type="button"
                    className={`bin-btn bin-btn--good ${isGood ? 'active' : ''}`}
                    onClick={() => setItemValue(item.key, true)}
                  >
                    <Check size={16} /> Bueno
                  </button>
                  <button
                    type="button"
                    className={`bin-btn bin-btn--bad ${isBad ? 'active' : ''}`}
                    onClick={() => setItemValue(item.key, false)}
                  >
                    <XCircle size={16} /> Malo
                  </button>
                </div>
              </div>

              {isBad && (
                <div className="fault-details">
                  <textarea
                    className={`fault-desc ${!st.descripcion.trim() ? 'is-invalid' : ''}`}
                    rows={2}
                    placeholder="Describa el hallazgo (obligatorio)…"
                    value={st.descripcion}
                    onChange={e => setItemDesc(item.key, e.target.value)}
                  />
                  <FaultPhoto
                    itemKey={item.key}
                    hint={item.hint}
                    onPhotoChange={(file, geo) => setItemPhoto(item.key, file, geo)}
                  />
                  {needsEvidence && (
                    <p className="fault-warning">
                      <AlertTriangle size={14} /> Descripción y foto del hallazgo son obligatorias.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderGeneralPhotos = () => (
    <div className="step-body">
      <p className="gen-photo-hint">Puede omitir fotos. Orden sugerido: izquierda, trasera, derecha y frontal.</p>
      <div className="gen-photo-grid">
        {GENERAL_PHOTOS.map(label => {
          const file = generalPhotos[label];
          const previewUrl = file ? URL.createObjectURL(file) : null;
          return (
            <label
              key={label}
              className={`gen-photo-card ${file ? 'has-file' : ''}`}
            >
              <input type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }}
                onChange={e => handleGenPhoto(label, e)} />
              {previewUrl ? (
                <img src={previewUrl} alt={label} className="gen-photo-preview" />
              ) : (
                <UploadCloud size={36} className="gen-photo-icon" />
              )}
              <span className="gen-photo-label">{label}</span>
              {file
                ? <span className="gen-photo-ok">✓ Cargada</span>
                : <span className="gen-photo-req">Opcional</span>
              }
            </label>
          );
        })}
      </div>
    </div>
  );

  const renderClosure = () => (
    <div className="step-body">
      {hasBadBlocking && (
        <div className="resultado-noapto">
          <AlertTriangle size={24} />
          <div>
            <strong>Vehículo No Apto para Operar</strong>
            <p>Se detectaron fallas en ítems críticos (bloqueantes). Este vehículo no puede operar hasta ser revisado.</p>
          </div>
        </div>
      )}
      {!hasBadBlocking && (
        <div className="resultado-apto">
          <CheckCircle size={24} />
          <strong>Vehículo Apto</strong>
        </div>
      )}

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label className="form-label">Observaciones Generales (Opcional)</label>
        <textarea name="observaciones" value={formData.observaciones}
          onChange={handleInput} rows={4}
          placeholder="Detalles adicionales o notas para mantenimiento…" />
      </div>

      <div className="form-group">
        <label className="form-label">Firma Digital</label>
        <SignatureCanvas onSignatureChange={setSignature} />
        {!signature && <span className="invalid-feedback">La firma es obligatoria.</span>}
      </div>

      <div className="acepto-box">
        <input type="checkbox" id="acepto-envio"
          checked={aceptoEnvio}
          onChange={e => setAceptoEnvio(e.target.checked)}
          className="acepto-checkbox" />
        <label htmlFor="acepto-envio" className="acepto-label">
          Acepto el envío de esta inspección y declaro que los datos son verídicos.
        </label>
      </div>
    </div>
  );

  const renderStepContent = () => {
    const stepId = activeSteps[currentStep].id;
    if (stepId === 'identificacion') return renderIdentification();
    if (stepId === 'fotos')          return renderGeneralPhotos();
    if (stepId === 'cierre')         return renderClosure();
    return renderCheckSection(stepId);
  };

  const isLastStep = currentStep === activeSteps.length - 1;
  const canAdvance = stepComplete(currentStep);

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-header-inner">
          <div>
            <h1 className="app-title">Monitoring</h1>
            <p className="app-subtitle">Gestión de Activos · Inspección ECF 4</p>
          </div>
          {hasBadBlocking && (
            <div className="header-alert-badge">
              <AlertTriangle size={16} /> No Apto
            </div>
          )}
        </div>
      </header>

      {/* ── Stepper ── */}
      <nav className="stepper" aria-label="pasos">
        {activeSteps.map((step, i) => {
          const done = stepComplete(i);
          const active = i === currentStep;
          return (
            <button
              key={step.id}
              type="button"
              className={`stepper-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}
              onClick={() => setCurrentStep(i)}
            >
              <span className="stepper-num">
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span className="stepper-label">{step.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Alerts ── */}
      {statusMessage && (
        <div className={`page-alert page-alert--${statusMessage.type}`}>
          {statusMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {statusMessage.text}
        </div>
      )}

      {/* ── Step card ── */}
      <main className="step-card">
        <div className="step-card-header">
          <span className="step-card-icon">
            {currentStep < 2 ? <FileText size={22} /> : sectionIcon(activeSteps[currentStep].id)}
          </span>
          <h2 className="step-card-title">{activeSteps[currentStep].label}</h2>
          <span className="step-counter">{currentStep + 1} / {activeSteps.length}</span>
        </div>

        <form onSubmit={handleSubmit}>
          {renderStepContent()}

          {/* ── Navigation ── */}
          <div className="step-nav">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setCurrentStep(p => p - 1)}
              disabled={currentStep === 0}
            >
              <ChevronLeft size={18} /> Anterior
            </button>

            {!isLastStep ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCurrentStep(p => p + 1)}
                disabled={!canAdvance}
              >
                Siguiente <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-action"
                disabled={!allComplete || loading}
              >
                {loading ? 'Enviando…' : <><Send size={18} /> Enviar Inspección</>}
              </button>
            )}
          </div>

          {!canAdvance && (
            <p className="step-warning">
              <AlertTriangle size={14} />
              {activeSteps[currentStep].id === 'identificacion'
                ? 'Complete todos los campos de identificación para continuar.'
                : activeSteps[currentStep].id === 'fotos'
                ? 'Suba las 4 fotografías generales para continuar.'
                : activeSteps[currentStep].id === 'cierre'
                ? 'Firme y marque la casilla de aceptación para enviar.'
                : 'Evalúe todos los ítems. Si marca "Malo", complete la descripción y foto del hallazgo.'}
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
