import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [is2FAFlow, setIs2FAFlow] = useState(false);
  const [tempUserId, setTempUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: 'sameer@gmail.com', password });
      if (res.data.success) {
        if (res.data.data.requires2FA) {
          setIs2FAFlow(true);
          setTempUserId(res.data.data.userId);
        } else {
          setAuth(res.data.data.user, res.data.data.accessToken);
          navigate(res.data.data.user.role === 'cashier' ? '/pos' : '/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-2fa', { userId: tempUserId, token: otp });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.accessToken);
        navigate(res.data.data.user.role === 'cashier' ? '/pos' : '/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#6366f1', borderRadius: '50%', color: 'white', marginBottom: '1rem' }}>
            {is2FAFlow ? <ShieldCheck size={32} /> : <ShoppingCart size={32} />}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>A. M. Mangilal Toy World POS</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {is2FAFlow ? 'Enter 2FA Code' : 'Sign in to your account'}
          </p>
        </div>

        {error && <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

        {!is2FAFlow ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>6-digit Code</label>
              <input
                type="text"
                className="input-field"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button type="button" onClick={() => setIs2FAFlow(false)} className="btn btn-outline" style={{ width: '100%' }}>
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
