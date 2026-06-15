import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Package, AlertTriangle, IndianRupee, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [summary, setSummary] = useState({
    totalProducts: 0, lowStockCount: 0, todaySales: 0, totalRevenue: 0
  });

  useEffect(() => {
    api.get('/analytics/dashboard').then(res => setSummary(res.data.data)).catch(console.error);
  }, []);

  const cards = [
    { title: 'Total Products', value: summary.totalProducts, icon: Package, color: '#3b82f6' },
    { title: 'Low Stock Items', value: summary.lowStockCount, icon: AlertTriangle, color: '#ef4444' },
    { title: "Today's Sales", value: `₹${summary.todaySales}`, icon: IndianRupee, color: '#10b981' },
    { title: 'Total Revenue', value: `₹${summary.totalRevenue}`, icon: TrendingUp, color: '#8b5cf6' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Dashboard Overview</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ backgroundColor: `${c.color}20`, color: c.color, padding: '1rem', borderRadius: '50%' }}>
                <Icon size={24} />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{c.title}</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{c.value}</h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
