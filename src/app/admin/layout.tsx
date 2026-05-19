import { ReactNode } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Truck, 
  ClipboardCheck, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  ChevronRight,
  User
} from 'lucide-react';
import './admin.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo-box">
            <ClipboardCheck size={28} className="logo-icon" />
            <span className="logo-text">ECF 4 Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link href="/admin" className="nav-item">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/inspections" className="nav-item">
            <ClipboardCheck size={20} />
            <span>Inspecciones</span>
          </Link>
          <Link href="/admin/vehicles" className="nav-item">
            <Truck size={20} />
            <span>Flota / Vehículos</span>
          </Link>
          <Link href="/admin/inspectors" className="nav-item">
            <User size={20} />
            <span>Responsables</span>
          </Link>
          <div className="nav-divider">OPERACIÓN</div>
          <Link href="/admin/config" className="nav-item">
            <Settings size={20} />
            <span>Configuración</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn">
              <Menu size={24} />
            </button>
            <div className="breadcrumb">
              <span>Admin</span>
              <ChevronRight size={16} />
              <span className="current">Dashboard</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Buscar patente o conductor..." />
            </div>
            <button className="icon-btn notification-btn">
              <Bell size={20} />
              <span className="badge">3</span>
            </button>
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">Administrador</span>
                <span className="user-role">Super Admin</span>
              </div>
              <div className="user-avatar">AD</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
