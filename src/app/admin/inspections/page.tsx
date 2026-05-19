'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  User,
  Truck,
  CheckCircle,
  AlertTriangle,
  Settings,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';

interface Inspection {
  id: string;
  created_at: string;
  fecha: string;
  hora: string;
  responsable_inspeccion: string;
  patente: string;
  resultado: string;
  kilometraje: number;
}

import { Suspense } from 'react';

export default function InspectionsPage() {
  return (
    <Suspense fallback={<div className="loading-state">Cargando...</div>}>
      <InspectionsContent />
    </Suspense>
  );
}

function InspectionsContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search');
  
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [expandedPatente, setExpandedPatente] = useState<string | null>(null);

  useEffect(() => {
    fetchInspections();
  }, []);

  async function fetchInspections() {
    setLoading(true);
    const { data, error } = await supabase
      .from('monitoring_inspections')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching inspections:', error);
    else setInspections(data || []);
    setLoading(false);
  }

  // Grouping logic
  const grouped = inspections.reduce((acc: any, curr) => {
    if (!acc[curr.patente]) acc[curr.patente] = [];
    acc[curr.patente].push(curr);
    return acc;
  }, {});

  const patentes = Object.keys(grouped).filter(p => 
    p.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grouped[p].some((i: Inspection) => i.responsable_inspeccion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="inspections-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de Inspecciones</h1>
          <p className="page-subtitle">Revisa el cumplimiento de ECF 4 por vehículo.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchInspections}>
            <RefreshCw size={18} />
            <span className="hide-mobile">Actualizar</span>
          </button>
          <Link href="/admin/config" className="btn-secondary">
            <Settings size={18} />
            <span className="hide-mobile">Configuración</span>
          </Link>
          <button className="btn-secondary">
            <Download size={18} />
            <span className="hide-mobile">Exportar Excel</span>
          </button>
        </div>
      </div>

      <div className="table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por patente o responsable..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="filter-btn">
          <Filter size={18} />
          <span>Filtros</span>
        </button>
      </div>

      <div className="inspection-groups">
        {loading ? (
          <div className="loading-state">Cargando registros...</div>
        ) : patentes.length === 0 ? (
          <div className="empty-state">No se encontraron inspecciones.</div>
        ) : (
          patentes.map(patente => (
            <div key={patente} className={`patente-group ${expandedPatente === patente ? 'expanded' : ''}`}>
              <div 
                className="group-header"
                onClick={() => setExpandedPatente(expandedPatente === patente ? null : patente)}
              >
                <div className="group-info">
                  <div className="patente-plate">{patente}</div>
                  <div className="group-stats">
                    <span>{grouped[patente].length} Inspecciones</span>
                    <span className="dot">•</span>
                    <span className="last-date">Última: {new Date(grouped[patente][0].created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="group-right">
                   <div className={`status-summary ${grouped[patente][0].resultado === 'Vehículo Apto' ? 'apto' : 'no-apto'}`}>
                      {grouped[patente][0].resultado === 'Vehículo Apto' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                      <span>{grouped[patente][0].resultado}</span>
                   </div>
                   {expandedPatente === patente ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </div>
              </div>

              {expandedPatente === patente && (
                <div className="group-content">
                  <table className="inner-table">
                    <thead>
                      <tr>
                        <th>Fecha / Hora</th>
                        <th>Responsable</th>
                        <th>Kilometraje</th>
                        <th>Resultado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[patente].map((insp: Inspection) => (
                        <tr key={insp.id}>
                          <td>
                            <div className="date-cell">
                              <Calendar size={14} />
                              <span>{new Date(insp.created_at).toLocaleDateString()} {insp.hora}</span>
                            </div>
                          </td>
                          <td>
                            <div className="user-cell">
                              <User size={14} />
                              <span>{insp.responsable_inspeccion}</span>
                            </div>
                          </td>
                          <td>{insp.kilometraje?.toLocaleString()} KM</td>
                          <td>
                            <span className={`result-tag ${insp.resultado === 'Vehículo Apto' ? 'apto' : 'no-apto'}`}>
                              {insp.resultado}
                            </span>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button className="action-btn" title="Ver Detalle"><Eye size={16} /></button>
                              <button className="action-btn" title="Descargar PDF"><FileText size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
