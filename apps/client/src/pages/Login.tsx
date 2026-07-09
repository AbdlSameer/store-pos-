import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email,
        password,
        ...(needsTwoFactor ? { otp } : {}),
      });

      if (res.data.data?.requiresTwoFactor) {
        // Correct email/password, but this account (e.g. the owner)
        // has 2FA enabled - ask for the authenticator code next.
        setNeedsTwoFactor(true);
        return;
      }

      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.accessToken);
        navigate(res.data.data.user.role === 'cashier' ? '/pos' : '/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#6366f1', borderRadius: '50%', color: 'white', marginBottom: '1rem' }}>
            {needsTwoFactor ? <ShieldCheck size={32} /> : <ShoppingCart size={32} />}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>A. M. Mangilal Toy World POS</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {needsTwoFactor ? 'Enter 2FA Code' : 'Sign in to your account'}
          </p>
        </div>

        {error && <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

        {!needsTwoFactor ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.875rem' }}>
              <ShieldCheck size={18} />
              <span>Enter the 6-digit code from your authenticator app</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="input-field"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              autoFocus
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading || otp.length !== 6} style={{ width: '100%' }}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setNeedsTwoFactor(false); setOtp(''); }}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
