'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Truck, 
  MoreVertical,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Vehicle {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  km_actual: number;
  is_active: boolean;
  fecha_revision_tecnica: string;
  proveedor_arriendo: string;
  certificado_torque_ruedas?: string;
  certificado_gps?: string;
  contrato_pertenece?: string;
  vencimiento_seguro?: string;
  vencimiento_permiso?: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    patente: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    km_actual: 0,
    fecha_revision_tecnica: '',
    proveedor_arriendo: '',
    certificado_torque_ruedas: '',
    certificado_gps: '',
    contrato_pertenece: '',
    vencimiento_seguro: '',
    vencimiento_permiso: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('patente', { ascending: true });
    
    if (error) console.error('Error fetching vehicles:', error);
    else setVehicles(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      patente: formData.patente.toUpperCase()
    };

    let error;
    if (editingVehicle) {
      const { error: err } = await supabase
        .from('vehicles')
        .update(payload)
        .eq('id', editingVehicle.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('vehicles')
        .insert([payload]);
      error = err;
    }

    if (error) {
      alert('Error al guardar vehículo: ' + error.message);
    } else {
      setShowModal(false);
      resetForm();
      fetchVehicles();
    }
    setLoading(false);
  }

  async function toggleStatus(vehicle: Vehicle) {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_active: !vehicle.is_active })
      .eq('id', vehicle.id);
    
    if (error) alert('Error: ' + error.message);
    else fetchVehicles();
  }

  function handleEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setFormData({
      patente: vehicle.patente,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      anio: vehicle.anio,
      km_actual: vehicle.km_actual,
      fecha_revision_tecnica: vehicle.fecha_revision_tecnica || '',
      proveedor_arriendo: vehicle.proveedor_arriendo || '',
      certificado_torque_ruedas: vehicle.certificado_torque_ruedas || '',
      certificado_gps: vehicle.certificado_gps || '',
      contrato_pertenece: vehicle.contrato_pertenece || '',
      vencimiento_seguro: vehicle.vencimiento_seguro || '',
      vencimiento_permiso: vehicle.vencimiento_permiso || ''
    });
    setShowModal(true);
  }

  function resetForm() {
    setEditingVehicle(null);
    setFormData({
      patente: '',
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      km_actual: 0,
      fecha_revision_tecnica: '',
      proveedor_arriendo: '',
      certificado_torque_ruedas: '',
      certificado_gps: '',
      contrato_pertenece: '',
      vencimiento_seguro: '',
      vencimiento_permiso: ''
    });
  }

  const filteredVehicles = vehicles.filter(v => 
    v.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="vehicles-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Flota</h1>
          <p className="page-subtitle">Configura los vehículos autorizados para operación.</p>
        </div>
        <button 
          className="btn-add"
          onClick={() => { resetForm(); setShowModal(true); }}
        >
          <Plus size={20} />
          <span>Nuevo Vehículo</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por patente, marca o modelo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="stats-mini">
          Total: <strong>{vehicles.length}</strong>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Patente</th>
              <th>Marca / Modelo</th>
              <th>Proveedor</th>
              <th>Venc. Rev. Técnica</th>
              <th>Kilometraje</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && vehicles.length === 0 ? (
              <tr><td colSpan={6} className="text-center">Cargando flota...</td></tr>
            ) : filteredVehicles.length === 0 ? (
              <tr><td colSpan={6} className="text-center">No se encontraron vehículos.</td></tr>
            ) : (
              filteredVehicles.map(v => (
                <tr key={v.id}>
                  <td>
                    <div className="patente-badge">{v.patente}</div>
                  </td>
                  <td>
                    <div className="vehicle-info">
                      <span className="v-marca">{v.marca}</span>
                      <span className="v-modelo">{v.modelo} ({v.anio})</span>
                    </div>
                  </td>
                  <td>{v.proveedor_arriendo}</td>
                  <td>
                    <span className={`date-badge ${new Date(v.fecha_revision_tecnica) < new Date() ? 'expired' : ''}`}>
                      {new Date(v.fecha_revision_tecnica).toLocaleDateString()}
                    </span>
                  </td>
                  <td>{v.km_actual.toLocaleString()} KM</td>
                  <td>
                    <span className={`status-pill ${v.is_active ? 'active' : 'inactive'}`}>
                      {v.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="icon-btn edit" onClick={() => handleEdit(v)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className={`icon-btn ${v.is_active ? 'deactivate' : 'activate'}`} 
                        onClick={() => toggleStatus(v)}
                        title={v.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {v.is_active ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingVehicle ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Patente</label>
                    <input 
                      type="text" 
                      placeholder="Ej: ABCD-12" 
                      required 
                      value={formData.patente}
                      onChange={e => setFormData({...formData, patente: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Año</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.anio}
                      onChange={e => setFormData({...formData, anio: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Marca</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Toyota" 
                      required 
                      value={formData.marca}
                      onChange={e => setFormData({...formData, marca: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Modelo</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Hilux" 
                      required 
                      value={formData.modelo}
                      onChange={e => setFormData({...formData, modelo: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Kilometraje Inicial / Actual</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.km_actual}
                      onChange={e => setFormData({...formData, km_actual: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Proveedor de Arriendo</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Mitta, Europecar" 
                      required 
                      value={formData.proveedor_arriendo}
                      onChange={e => setFormData({...formData, proveedor_arriendo: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha Revisión Técnica</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.fecha_revision_tecnica}
                      onChange={e => setFormData({...formData, fecha_revision_tecnica: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Contrato Perteneciente</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Contrato Minería X" 
                      value={formData.contrato_pertenece}
                      onChange={e => setFormData({...formData, contrato_pertenece: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Certificado de Torque</label>
                    <input 
                      type="text" 
                      placeholder="N° Certificado o Ref" 
                      value={formData.certificado_torque_ruedas}
                      onChange={e => setFormData({...formData, certificado_torque_ruedas: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Certificado GPS</label>
                    <input 
                      type="text" 
                      placeholder="N° Certificado o Ref" 
                      value={formData.certificado_gps}
                      onChange={e => setFormData({...formData, certificado_gps: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Vencimiento Seguro</label>
                    <input 
                      type="date" 
                      value={formData.vencimiento_seguro}
                      onChange={e => setFormData({...formData, vencimiento_seguro: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Vencimiento Permiso Circulacion</label>
                    <input 
                      type="date" 
                      value={formData.vencimiento_permiso}
                      onChange={e => setFormData({...formData, vencimiento_permiso: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Guardando...' : editingVehicle ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
