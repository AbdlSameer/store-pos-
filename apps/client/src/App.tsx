import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

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

function PrivateRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'cashier' ? '/pos' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }, 15 * 60 * 1000); // 15 minutes
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return (
    <BrowserRouter>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
