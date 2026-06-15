import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CheckCircle } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const acknowledge = async (id: string) => {
    try {
      await api.patch(`/alerts/${id}/acknowledge`);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Stock Alerts</h1>
      <div className="card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Product</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Current Stock</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Threshold</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active alerts</td></tr>
            ) : alerts.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{a.product?.name} ({a.product?.sku})</td>
                <td style={{ padding: '1rem 1.5rem', color: '#ef4444', fontWeight: 'bold' }}>{a.currentQuantity}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{a.threshold}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <button onClick={() => acknowledge(a.id)} className="btn btn-primary" style={{ backgroundColor: '#10b981', color: 'white' }}>
                    <CheckCircle size={16} /> Acknowledge
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
