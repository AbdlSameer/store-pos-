import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Analytics() {
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    api.get('/analytics/top-products').then(res => setTopProducts(res.data.data)).catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Sales Analytics</h1>
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Top Selling Products</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Product ID</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Units Sold</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.length === 0 ? (
              <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</td></tr>
            ) : topProducts.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 500 }}>{p.product?.name || 'Unknown Product'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.product?.sku || p.productId}</div>
                </td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p._sum.unitsSold}</td>
                <td style={{ padding: '1rem', color: 'var(--secondary)', fontWeight: 600 }}>₹{p._sum.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
