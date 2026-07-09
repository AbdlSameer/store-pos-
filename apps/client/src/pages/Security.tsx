import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { ShieldCheck } from 'lucide-react';

// Only meaningful for the owner (super_admin) account - that's the
// account attackers would want most, so it's the one 2FA protects.
export default function Security() {
  const user = useAuthStore((s) => s.user);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/2fa/setup');
      setSecret(res.data.data.secret);
      setOtpauthUrl(res.data.data.otpauthUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/2fa/confirm', { otp });
      setMessage('2FA is now enabled on this account.');
      setSecret(null);
      setOtpauthUrl(null);
      setOtp('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code, try again');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Disable 2FA for this account?')) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/2fa/disable');
      setMessage('2FA has been disabled.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="card">
        <p style={{ color: '#64748b' }}>Only the store owner account can manage 2FA.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '480px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <ShieldCheck size={22} color="#6366f1" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Two-Factor Authentication</h2>
      </div>

      {error && <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
      {message && <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{message}</div>}

      {!secret ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Adds a second step at login using an authenticator app (Google Authenticator, Authy, 1Password, etc).
            Recommended for this owner account since it has full access to inventory, pricing, and reports.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={startSetup} disabled={loading}>
              Enable 2FA
            </button>
            <button className="btn" onClick={disable2FA} disabled={loading}>
              Disable 2FA
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={confirmSetup} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.875rem' }}>
            In your authenticator app, add a new account manually using this setup key:
          </p>
          <code style={{ display: 'block', padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px', wordBreak: 'break-all', fontSize: '0.875rem' }}>
            {secret}
          </code>
          {otpauthUrl && (
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              (Apps that accept a setup URL directly can also use: {otpauthUrl})
            </p>
          )}
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Enter the 6-digit code to confirm</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="input-field"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loading || otp.length !== 6}>
            Confirm & Enable
          </button>
        </form>
      )}
    </div>
  );
}
