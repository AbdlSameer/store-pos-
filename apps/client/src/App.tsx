import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useAuthBootstrap } from './hooks/useAuthBootstrap';
import { useIdleLogout } from './hooks/useIdleLogout';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import POS from './pages/POS';
import BillHistory from './pages/BillHistory';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Security from './pages/Security';

function PrivateRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'cashier' ? '/pos' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

// Runs the idle-logout watcher for any authenticated route tree.
// Kept as its own component (rather than inline in App) so it only
// mounts once, inside the router context it needs for navigate().
function IdleWatcher({ children }: { children: React.ReactNode }) {
  useIdleLogout();
  return <>{children}</>;
}

export default function App() {
  const hydrated = useAuthStore((s) => s.hydrated);
  useAuthBootstrap();

  // Avoid a flash-redirect to /login while we're still checking the
  // httpOnly refresh cookie for an existing session.
  if (!hydrated) return null;

  return (
    <BrowserRouter>
      <IdleWatcher>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<PrivateRoute roles={['super_admin', 'admin']}><Dashboard /></PrivateRoute>} />
            <Route path="products" element={<PrivateRoute roles={['super_admin', 'admin', 'cashier']}><Products /></PrivateRoute>} />
            <Route path="pos" element={<PrivateRoute roles={['super_admin', 'admin', 'cashier']}><POS /></PrivateRoute>} />
            <Route path="bill-history" element={<PrivateRoute roles={['super_admin', 'admin', 'cashier']}><BillHistory /></PrivateRoute>} />
            <Route path="alerts" element={<PrivateRoute roles={['super_admin', 'admin', 'cashier']}><Alerts /></PrivateRoute>} />
            <Route path="analytics" element={<PrivateRoute roles={['super_admin', 'admin']}><Analytics /></PrivateRoute>} />
            <Route path="security" element={<PrivateRoute roles={['super_admin']}><Security /></PrivateRoute>} />
          </Route>
        </Routes>
      </IdleWatcher>
    </BrowserRouter>
  );
}
