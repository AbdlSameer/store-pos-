import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ShieldCheck, Clock } from 'lucide-react';

// Parse "Try again in Xm Ys." from server error messages into seconds
function parseLockoutSeconds(msg: string): number {
  const m = msg.match(/(\d+)m\s+(\d+)s/);
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2]);
  const s = msg.match(/(\d+)s\./);
  if (s) return parseInt(s[1]);
  // Fallback — 15 minutes if pattern matches generic lockout
  if (msg.toLowerCase().includes('locked') || msg.toLowerCase().includes('15 minutes')) return 15 * 60;
  return 0;
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `0:${String(s).padStart(2, '0')}`;
}

export default function Login() {
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // Live countdown ticker
  useEffect(() => {
    if (lockoutSecs > 0) {
      countdownRef.current = setInterval(() => {
        setLockoutSecs(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [lockoutSecs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSecs > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        password,
        ...(needsTwoFactor ? { otp } : {}),
      });

      if (res.data.data?.requiresTwoFactor) {
        setNeedsTwoFactor(true);
        return;
      }

      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.accessToken);
        navigate(res.data.data.user.role === 'cashier' ? '/pos' : '/dashboard');
      }
    } catch (err: any) {
      const msg: string = err.response?.data?.message || 'Login failed';
      setError(msg);
      const secs = parseLockoutSeconds(msg);
      if (secs > 0) {
        setLockoutSecs(secs);
      }
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

        {/* Error / lockout banner */}
        {error && (
          <div style={{
            backgroundColor: lockoutSecs > 0 ? '#fff7ed' : '#fee2e2',
            color: lockoutSecs > 0 ? '#c2410c' : '#ef4444',
            border: `1px solid ${lockoutSecs > 0 ? '#fed7aa' : '#fecaca'}`,
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            {lockoutSecs > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <span>{error.replace(/Try again in.*/, '').trim()}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  <Clock size={14} />
                  {formatCountdown(lockoutSecs)}
                </span>
              </div>
            ) : error}
          </div>
        )}

        {!needsTwoFactor ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password / PIN</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={lockoutSecs > 0}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || lockoutSecs > 0}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Signing in...' : lockoutSecs > 0 ? `Locked — ${formatCountdown(lockoutSecs)}` : 'Sign In'}
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
