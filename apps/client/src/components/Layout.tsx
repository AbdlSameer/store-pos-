import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Package, ShoppingCart, Bell, BarChart3, LogOut, Receipt } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/pos', label: 'POS Terminal', icon: ShoppingCart },
    { path: '/bill-history', label: 'Bill History', icon: Receipt },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', flexDirection: 'row' }}>
      <aside className="app-sidebar" style={{ width: '250px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6366f1' }}>A. M. Mangilal Toy World POS</h1>
        </div>
        
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  color: isActive ? '#6366f1' : '#64748b',
                  backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={20} />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.fullName}</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="btn" style={{ width: '100%', color: '#ef4444', justifyContent: 'flex-start' }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
