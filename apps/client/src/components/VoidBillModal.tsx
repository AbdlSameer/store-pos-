import React, { useState } from 'react';
import { api } from '../services/api';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface Props {
  bill: { id: string; billNumber: string };
  onClose: () => void;
  onVoided: () => void;
}

export default function VoidBillModal({ bill, onClose, onVoided }: Props) {
  const [reason, setReason] = useState('');
  const [approverEmail, setApproverEmail] = useState('');
  const [approverPassword, setApproverPassword] = useState('');
  const [approverOtp, setApproverOtp] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post(`/pos/bills/${bill.id}/void`, {
        reason,
        approverEmail,
        approverPassword,
        ...(needsOtp ? { approverOtp } : {}),
      });

      if (res.data.data?.requiresTwoFactor) {
        setNeedsOtp(true);
        return;
      }

      onVoided();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Void failed. Check approver credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ backgroundColor: '#fef2f2', borderRadius: '50%', padding: '0.5rem', display: 'flex' }}>
            {needsOtp ? <ShieldCheck size={22} color="#ef4444" /> : <ShieldAlert size={22} color="#ef4444" />}
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Void Bill {bill.billNumber}</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {needsOtp ? 'Enter approver 2FA code' : 'Requires manager approval'}
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem',
            borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {!needsOtp ? (
            <>
              {/* Void reason */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Void Reason *
                </label>
                <textarea
                  className="input-field"
                  placeholder="e.g. Customer returned items, billing error..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Approver credentials */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  A manager must enter <strong>their own</strong> credentials to authorise this void.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="Manager email"
                    value={approverEmail}
                    onChange={e => setApproverEmail(e.target.value)}
                    autoComplete="off"
                    required
                  />
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Manager password"
                    value={approverPassword}
                    onChange={e => setApproverPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            /* Step 2: OTP */
            <div>
              <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} />
                Enter the 6-digit code from the approver's authenticator app
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input-field"
                placeholder="000000"
                value={approverOtp}
                onChange={e => setApproverOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                required
                style={{ fontSize: '1.25rem', letterSpacing: '0.25rem', textAlign: 'center' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { if (needsOtp) setNeedsOtp(false); else onClose(); }}>
              {needsOtp ? '← Back' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="btn"
              disabled={loading || (needsOtp && approverOtp.length !== 6)}
              style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}
            >
              {loading ? 'Processing...' : needsOtp ? 'Verify & Void' : 'Request Void'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
