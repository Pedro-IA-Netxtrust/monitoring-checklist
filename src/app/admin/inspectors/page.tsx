'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User, 
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Phone,
  Fingerprint,
  History,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Inspector {
  id: string;
  nombre: string;
  cargo: string;
  rut: string;
  telefono: string;
  tipo_usuario: string;
  is_active: boolean;
  vencimiento_licencia_municipal?: string;
  vencimiento_licencia_interna?: string;
}

export default function InspectorsPage() {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInspector, setEditingInspector] = useState<Inspector | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rutError, setRutError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    cargo: '',
    rut: '',
    telefono: '',
    tipo_usuario: 'Normal',
    vencimiento_licencia_municipal: '',
    vencimiento_licencia_interna: ''
  });

  useEffect(() => {
    fetchInspectors();
  }, []);

  async function fetchInspectors() {
    setLoading(true);
    const { data, error } = await supabase
      .from('inspectors')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) console.error('Error fetching inspectors:', error);
    else setInspectors(data || []);
    setLoading(false);
  }

  const validateRut = (rut: string) => {
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
    if (cleanRut.length < 8) return false;
    
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toLowerCase();
    
    let sum = 0;
    let mul = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * mul;
      mul = mul === 7 ? 2 : mul + 1;
    }
    
    const res = 11 - (sum % 11);
    const calculatedDv = res === 11 ? '0' : res === 10 ? 'k' : res.toString();
    
    return calculatedDv === dv;
  };

  const formatRut = (value: string) => {
    let rut = value.replace(/[^\dkK]/g, '');
    if (rut.length > 1) {
      const body = rut.slice(0, -1);
      const dv = rut.slice(-1);
      rut = body + '-' + dv;
    }
    return rut;
  };

  const formatPhone = (value: string) => {
    // Basic formatting for Chilean mobile: +56 9 XXXX XXXX
    let num = value.replace(/\D/g, '');
    if (num.startsWith('56')) num = num.slice(2);
    if (num.length > 9) num = num.slice(0, 9);
    
    if (num.length === 0) return '';
    
    let formatted = '+56 9 ';
    if (num.startsWith('9')) num = num.slice(1);
    
    if (num.length > 4) {
      formatted += num.slice(0, 4) + ' ' + num.slice(4);
    } else {
      formatted += num;
    }
    return formatted;
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setFormData({ ...formData, rut: formatted });
    
    if (formatted && !validateRut(formatted)) {
      setRutError('RUT inválido');
    } else {
      setRutError('');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, telefono: formatted });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateRut(formData.rut)) {
      setRutError('Por favor ingrese un RUT válido');
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      vencimiento_licencia_municipal: formData.vencimiento_licencia_municipal || null,
      vencimiento_licencia_interna: formData.vencimiento_licencia_interna || null
    };

    let error;
    if (editingInspector) {
      const { error: err } = await supabase
        .from('inspectors')
        .update(payload)
        .eq('id', editingInspector.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('inspectors')
        .insert([payload]);
      error = err;
    }

    if (error) {
      alert('Error al guardar responsable: ' + error.message);
    } else {
      setShowModal(false);
      resetForm();
      fetchInspectors();
    }
    setLoading(false);
  }

  async function toggleStatus(inspector: Inspector) {
    const { error } = await supabase
      .from('inspectors')
      .update({ is_active: !inspector.is_active })
      .eq('id', inspector.id);
    
    if (error) alert('Error: ' + error.message);
    else fetchInspectors();
  }

  function handleEdit(inspector: Inspector) {
    setEditingInspector(inspector);
    setFormData({
      nombre: inspector.nombre || '',
      cargo: inspector.cargo || '',
      rut: inspector.rut || '',
      telefono: inspector.telefono || '',
      tipo_usuario: inspector.tipo_usuario || 'Normal',
      vencimiento_licencia_municipal: inspector.vencimiento_licencia_municipal || '',
      vencimiento_licencia_interna: inspector.vencimiento_licencia_interna || ''
    });
    setRutError('');
    setShowModal(true);
  }

  function resetForm() {
    setEditingInspector(null);
    setFormData({
      nombre: '',
      cargo: '',
      rut: '',
      telefono: '',
      tipo_usuario: 'Normal',
      vencimiento_licencia_municipal: '',
      vencimiento_licencia_interna: ''
    });
    setRutError('');
  }

  const filtered = inspectors.filter(i => 
    i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.rut.includes(searchTerm)
  );

  return (
    <div className="inspectors-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal Responsable</h1>
          <p className="page-subtitle">Gestiona quiénes están autorizados para realizar inspecciones.</p>
        </div>
        <button 
          className="btn-add"
          onClick={() => { resetForm(); setShowModal(true); }}
        >
          <Plus size={20} />
          <span>Nuevo Responsable</span>
        </button>
      </div>

      <div className="table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, RUT o cargo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="stats-mini">
          Total: <strong>{inspectors.length}</strong>
        </div>
      </div>

      <div className="table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre / RUT</th>
              <th>Cargo</th>
              <th>Contacto</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && inspectors.length === 0 ? (
              <tr><td colSpan={6} className="text-center">Cargando personal...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center">No se encontró personal registrado.</td></tr>
            ) : (
              filtered.map(i => (
                <tr key={i.id}>
                  <td>
                    <div className="user-cell-info">
                      <div className="user-avatar-small">
                        {i.nombre ? i.nombre.charAt(0) : '?'}
                      </div>
                      <div className="user-text-details">
                        <span className="user-name-text">{i.nombre}</span>
                        <span className="user-rut-text">{i.rut}</span>
                      </div>
                    </div>
                  </td>
                  <td>{i.cargo}</td>
                  <td>
                    <div className="contact-cell">
                      {i.telefono ? (
                        <>
                          <Phone size={14} className="text-muted" />
                          <span>{i.telefono}</span>
                        </>
                      ) : <span className="text-muted italic">No registrado</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`role-pill ${i.tipo_usuario.toLowerCase()}`}>
                      {i.tipo_usuario === 'Admin' && <ShieldCheck size={12} />}
                      {i.tipo_usuario}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${i.is_active ? 'active' : 'inactive'}`}>
                      {i.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <Link 
                        href={`/admin/inspections?search=${encodeURIComponent(i.nombre)}`}
                        className="icon-btn history"
                        title="Ver Historial de Inspecciones"
                      >
                        <History size={16} />
                      </Link>
                      <button className="icon-btn edit" onClick={() => handleEdit(i)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className={`icon-btn ${i.is_active ? 'deactivate' : 'activate'}`} 
                        onClick={() => toggleStatus(i)}
                        title={i.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {i.is_active ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingInspector ? 'Editar Responsable' : 'Registrar Nuevo Responsable'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Nombre Completo</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Juan Pérez" 
                      required 
                      value={formData.nombre}
                      onChange={e => setFormData({...formData, nombre: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>RUT</label>
                    <div className="input-with-icon">
                      <Fingerprint size={18} className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="12345678-9" 
                        required 
                        value={formData.rut}
                        onChange={handleRutChange}
                        className={rutError ? 'error' : ''}
                      />
                    </div>
                    {rutError && <span className="error-text">{rutError}</span>}
                  </div>

                  <div className="form-group">
                    <label>Teléfono (Opcional)</label>
                    <div className="input-with-icon">
                      <Phone size={18} className="input-icon" />
                      <input 
                        type="tel" 
                        placeholder="+56 9 1234 5678" 
                        value={formData.telefono}
                        onChange={handlePhoneChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Cargo</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Supervisor" 
                      required 
                      value={formData.cargo}
                      onChange={e => setFormData({...formData, cargo: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Tipo de Usuario</label>
                    <select 
                      value={formData.tipo_usuario}
                      onChange={e => setFormData({...formData, tipo_usuario: e.target.value})}
                    >
                      <option value="Normal">Usuario Normal</option>
                      <option value="Admin">Administrador de Flota</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Vencimiento Licencia Municipal</label>
                    <input 
                      type="date" 
                      value={formData.vencimiento_licencia_municipal}
                      onChange={e => setFormData({...formData, vencimiento_licencia_municipal: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Vencimiento Licencia Interna</label>
                    <input 
                      type="date" 
                      value={formData.vencimiento_licencia_interna}
                      onChange={e => setFormData({...formData, vencimiento_licencia_interna: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-submit" disabled={loading || !!rutError}>
                  {loading ? 'Guardando...' : editingInspector ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .inspectors-container { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .user-cell-info { display: flex; align-items: center; gap: 0.75rem; }
        .user-avatar-small {
          width: 36px; height: 36px; border-radius: 50%; background: var(--admin-primary-light);
          color: var(--admin-primary); display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem;
        }
        .user-text-details { display: flex; flex-direction: column; }
        .user-name-text { font-weight: 600; color: var(--admin-text); font-size: 0.9375rem; }
        .user-rut-text { font-size: 0.75rem; color: var(--admin-text-muted); font-family: monospace; }

        .contact-cell { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
        .italic { font-style: italic; font-size: 0.8rem; }
        
        .role-pill {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700;
          text-transform: uppercase;
        }
        .role-pill.admin { background: #eff6ff; color: #1d4ed8; }
        .role-pill.normal { background: #f1f5f9; color: #475569; }

        .input-with-icon { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 12px; color: var(--admin-text-muted); }
        .input-with-icon input { padding-left: 40px !important; width: 100%; }

        input.error { border-color: var(--danger) !important; }
        .error-text { color: var(--danger); font-size: 0.7rem; font-weight: 600; margin-top: 2px; }

        .icon-btn.history { background: #f8fafc; color: var(--admin-primary); border: 1px solid var(--admin-border); }
        .icon-btn.history:hover { background: var(--admin-primary); color: white; border-color: var(--admin-primary); }

        .form-group select {
          padding: 0.75rem; border: 1.5px solid var(--admin-border);
          border-radius: 0.75rem; outline: none; background: white;
        }
      `}</style>
    </div>
  );
}
