import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import PrintBillModal from '../components/PrintBillModal';
import VoidBillModal from '../components/VoidBillModal';
import { Trash2, Ban } from 'lucide-react';

export default function BillHistory() {
  const [bills, setBills] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [voidingBill, setVoidingBill] = useState<any>(null);
  const user = useAuthStore(s => s.user);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pos/history', {
        params: { page, limit, search, startDate, endDate }
      });
      setBills(res.data.data);
      setTotal(res.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch bill history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, limit, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handlePrint = async (billId: string) => {
    try {
      const res = await api.get(`/pos/history/${billId}`);
      setSelectedBill(res.data.data);
    } catch (error) {
      console.error('Failed to fetch bill details for printing:', error);
    }
  };

  const handleDelete = async (billId: string) => {
    if (!window.confirm('Are you sure you want to delete this bill? This action cannot be undone and will restore the inventory.')) return;
    try {
      await api.delete(`/pos/bills/${billId}`);
      fetchHistory();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete bill');
    }
  };

  const totalPages = Math.ceil(total / limit);

  const statusBadge = (bill: any) => {
    if (bill.paymentStatus === 'voided') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem',
            fontWeight: 700, backgroundColor: '#f1f5f9', color: '#94a3b8',
            border: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            <Ban size={10} /> VOIDED
          </span>
          {bill.approvedBy && (
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              by {bill.approvedBy.fullName}
            </span>
          )}
          {bill.voidReason && (
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>
              "{bill.voidReason}"
            </span>
          )}
        </div>
      );
    }
    return (
      <span style={{ textTransform: 'capitalize' }}>{bill.paymentMethod}</span>
    );
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Bill History</h2>
      </div>

      <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search Bill No or Customer..."
          className="input-field"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem' }}>From:</span>
          <input
            type="date"
            className="input-field"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem' }}>To:</span>
          <input
            type="date"
            className="input-field"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Search</button>
      </form>

      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Date</th>
                <th>Cashier</th>
                <th>Items</th>
                <th>Payment / Status</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No bills found</td>
                </tr>
              ) : (
                bills.map(bill => (
                  <tr key={bill.id} style={{ opacity: bill.paymentStatus === 'voided' ? 0.65 : 1 }}>
                    <td>{bill.billNumber}</td>
                    <td>{new Date(bill.createdAt).toLocaleString()}</td>
                    <td>{bill.cashier?.fullName || 'Admin'}</td>
                    <td>{bill.items?.length || 0}</td>
                    <td>{statusBadge(bill)}</td>
                    <td>
                      <strong style={{ textDecoration: bill.paymentStatus === 'voided' ? 'line-through' : 'none', color: bill.paymentStatus === 'voided' ? '#94a3b8' : 'inherit' }}>
                        ₹{Number(bill.totalAmount).toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          onClick={() => handlePrint(bill.id)}
                        >
                          Print
                        </button>

                        {/* Void button — all roles, only on non-voided bills */}
                        {bill.paymentStatus !== 'voided' && (
                          <button
                            className="btn"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}
                            onClick={() => setVoidingBill(bill)}
                            title="Void Bill"
                          >
                            <Ban size={14} />
                          </button>
                        )}

                        {/* Hard delete — admin only */}
                        {(user?.role === 'super_admin' || user?.role === 'admin') && (
                          <button
                            className="btn"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none' }}
                            onClick={() => handleDelete(bill.id)}
                            title="Delete Bill"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} bills
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedBill && (
        <PrintBillModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}

      {voidingBill && (
        <VoidBillModal
          bill={voidingBill}
          onClose={() => setVoidingBill(null)}
          onVoided={fetchHistory}
        />
      )}
    </div>
  );
}
