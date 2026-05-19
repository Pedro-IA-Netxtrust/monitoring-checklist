'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Truck,
  Calendar,
  UserCheck,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalInspections: 0,
    aptoCount: 0,
    noAptoCount: 0,
    todayCount: 0,
    criticalFails: [],
    avgKm: 0,
    expirations: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // Fetch total and apto/no-apto
        const { data: inspections, error } = await supabase
          .from('monitoring_inspections')
          .select('resultado, created_at, kilometraje');
        
        if (error) throw error;

        if (inspections) {
          const total = inspections.length;
          const apto = inspections.filter(i => i.resultado === 'Vehículo Apto').length;
          const noApto = total - apto;
          
          const today = new Date().toISOString().split('T')[0];
          const countToday = inspections.filter(i => i.created_at.startsWith(today)).length;
          
          const sumKm = inspections.reduce((acc, curr) => acc + (curr.kilometraje || 0), 0);
          const avg = total > 0 ? Math.round(sumKm / total) : 0;

          // Fetch expirations
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

          const { data: vExpirations } = await supabase
            .from('vehicles')
            .select('patente, fecha_revision_tecnica, vencimiento_seguro, vencimiento_permiso')
            .or(`fecha_revision_tecnica.lte.${thirtyDaysStr},vencimiento_seguro.lte.${thirtyDaysStr},vencimiento_permiso.lte.${thirtyDaysStr}`)
            .eq('is_active', true);

          const { data: iExpirations } = await supabase
            .from('inspectors')
            .select('nombre, vencimiento_licencia_municipal, vencimiento_licencia_interna')
            .or(`vencimiento_licencia_municipal.lte.${thirtyDaysStr},vencimiento_licencia_interna.lte.${thirtyDaysStr}`)
            .eq('is_active', true);

          const allExpirations: any[] = [];
          
          vExpirations?.forEach(v => {
            if (v.fecha_revision_tecnica && v.fecha_revision_tecnica <= thirtyDaysStr) 
              allExpirations.push({ id: v.patente, name: v.patente, type: 'Revisión Técnica', date: v.fecha_revision_tecnica, category: 'vehicle' });
            if (v.vencimiento_seguro && v.vencimiento_seguro <= thirtyDaysStr) 
              allExpirations.push({ id: v.patente, name: v.patente, type: 'Seguro', date: v.vencimiento_seguro, category: 'vehicle' });
            if (v.vencimiento_permiso && v.vencimiento_permiso <= thirtyDaysStr) 
              allExpirations.push({ id: v.patente, name: v.patente, type: 'Permiso Circ.', date: v.vencimiento_permiso, category: 'vehicle' });
          });

          iExpirations?.forEach(i => {
            if (i.vencimiento_licencia_municipal && i.vencimiento_licencia_municipal <= thirtyDaysStr)
              allExpirations.push({ id: i.nombre, name: i.nombre, type: 'Lic. Municipal', date: i.vencimiento_licencia_municipal, category: 'driver' });
            if (i.vencimiento_licencia_interna && i.vencimiento_licencia_interna <= thirtyDaysStr)
              allExpirations.push({ id: i.nombre, name: i.nombre, type: 'Lic. Interna', date: i.vencimiento_licencia_interna, category: 'driver' });
          });

          setStats({
            totalInspections: total,
            aptoCount: apto,
            noAptoCount: noApto,
            todayCount: countToday,
            criticalFails: [],
            avgKm: avg,
            expirations: allExpirations.sort((a, b) => a.date.localeCompare(b.date))
          });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Resumen de Operaciones</h1>
        <p className="page-subtitle">Panel de control de inspecciones y estado de flota ECF 4.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-box bg-blue">
            <BarChart3 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Inspecciones</span>
            <div className="stat-value-group">
              <span className="stat-value">{stats.totalInspections}</span>
              <span className="stat-trend up">
                <ArrowUpRight size={14} /> +12%
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box bg-success">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Vehículos Aptos</span>
            <div className="stat-value-group">
              <span className="stat-value">{stats.aptoCount}</span>
              <span className="stat-percent">
                {stats.totalInspections > 0 ? Math.round((stats.aptoCount / stats.totalInspections) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box bg-danger">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Vehículos No Aptos</span>
            <div className="stat-value-group">
              <span className="stat-value">{stats.noAptoCount}</span>
              <span className="stat-trend down">
                <ArrowDownRight size={14} /> Riesgo
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box bg-orange">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Inspecciones Hoy</span>
            <div className="stat-value-group">
              <span className="stat-value">{stats.todayCount}</span>
              <span className="stat-badge">En curso</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2">
        {/* Recent Alerts */}
        <div className="content-card">
          <div className="card-header">
            <h3 className="card-title">Alertas Críticas Recientes</h3>
            <button className="text-btn">Ver todas</button>
          </div>
          <div className="card-body">
            <div className="alert-list">
              {stats.noAptoCount === 0 ? (
                <div className="empty-state">No hay alertas críticas pendientes.</div>
              ) : (
                <div className="alert-item danger">
                  <div className="alert-icon"><AlertTriangle size={18} /></div>
                  <div className="alert-content">
                    <span className="alert-title">Falla en Frenos - ABCD-12</span>
                    <span className="alert-desc">Responsable: Juan Perez • Hace 2 horas</span>
                  </div>
                  <button className="alert-action">Atender</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fleet Distribution */}
        <div className="content-card">
          <div className="card-header">
            <h3 className="card-title">Distribución de Flota</h3>
            <BarChart3 size={18} className="text-muted" />
          </div>
          <div className="card-body">
             {/* Chart placeholder */}
             <div className="chart-placeholder">
                <div className="progress-bar-stack">
                  <div className="progress-segment success" style={{width: '75%'}}></div>
                  <div className="progress-segment danger" style={{width: '25%'}}></div>
                </div>
                <div className="chart-legend">
                   <div className="legend-item"><span className="dot success"></span> Aptos (75%)</div>
                   <div className="legend-item"><span className="dot danger"></span> No Aptos (25%)</div>
                </div>
             </div>
          </div>
        </div>

        {/* Upcoming Expirations */}
        <div className="content-card full-width">
          <div className="card-header">
            <h3 className="card-title">Próximos Vencimientos (30 días)</h3>
            <Calendar size={18} className="text-muted" />
          </div>
          <div className="card-body">
            <div className="expirations-grid">
              {stats.expirations.length === 0 ? (
                <div className="empty-state">No hay vencimientos próximos.</div>
              ) : (
                stats.expirations.map((exp, idx) => (
                  <div key={`${exp.id}-${idx}`} className={`exp-item ${new Date(exp.date) < new Date() ? 'expired' : 'warning'}`}>
                    <div className="exp-icon">
                      {exp.category === 'vehicle' ? <Truck size={18} /> : <UserCheck size={18} />}
                    </div>
                    <div className="exp-info">
                      <span className="exp-name">{exp.name}</span>
                      <span className="exp-type">{exp.type}</span>
                    </div>
                    <div className="exp-date">
                      <Clock size={14} />
                      {new Date(exp.date).toLocaleDateString()}
                    </div>
                    <div className="exp-status">
                      {new Date(exp.date) < new Date() ? 'Vencido' : 'Próximo'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .expirations-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        .exp-item { 
          display: flex; align-items: center; gap: 1rem; padding: 1rem; 
          border-radius: 0.75rem; border-left: 4px solid #e2e8f0; background: #f8fafc;
        }
        .exp-item.expired { border-left-color: var(--danger); background: #fff5f5; }
        .exp-item.warning { border-left-color: var(--orange); background: #fffaf0; }
        
        .exp-icon { width: 36px; height: 36px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .exp-item.expired .exp-icon { color: var(--danger); }
        .exp-item.warning .exp-icon { color: var(--orange); }
        
        .exp-info { flex: 1; display: flex; flex-direction: column; }
        .exp-name { font-weight: 700; color: var(--admin-text); font-size: 0.9375rem; }
        .exp-type { font-size: 0.75rem; color: var(--admin-text-muted); font-weight: 600; text-transform: uppercase; }
        
        .exp-date { display: flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; font-weight: 600; color: var(--admin-text); }
        .exp-status { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 0.2rem 0.5rem; border-radius: 4px; margin-left: 0.5rem; }
        .exp-item.expired .exp-status { background: var(--danger); color: white; }
        .exp-item.warning .exp-status { background: var(--orange); color: white; }
      `}</style>

    </div>
  );
}
