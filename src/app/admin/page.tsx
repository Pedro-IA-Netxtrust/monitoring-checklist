export default function AdminMovedPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        background: '#0f172a',
        color: '#e2e8f0',
      }}
    >
      <div style={{ maxWidth: 480, textAlign: 'center', lineHeight: 1.5 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
          Admin movido
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
          El panel de administración ya no forma parte del checklist por seguridad.
          Usa el módulo separado con login (RUT + correo Monitoring).
        </p>
        <p style={{ marginBottom: '1.25rem' }}>
          <a
            href="https://monitoring-admin-sigma.vercel.app/login"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.25rem',
              background: '#2563eb',
              color: '#fff',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Ir a Control de Vehículos
          </a>
        </p>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Checklist = inspección en terreno.
          <br />
          Control de Vehículos = flota, documentos e historial (acceso restringido).
        </p>
      </div>
    </main>
  );
}
