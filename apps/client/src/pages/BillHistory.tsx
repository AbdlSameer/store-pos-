import { useState, useEffect } from 'react';
import { api } from '../services/api';
import PrintBillModal from '../components/PrintBillModal';

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

  const totalPages = Math.ceil(total / limit);

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
                <th>Payment</th>
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
                  <tr key={bill.id}>
                    <td>{bill.billNumber}</td>
                    <td>{new Date(bill.createdAt).toLocaleString()}</td>
                    <td>{bill.cashier?.fullName || 'Admin'}</td>
                    <td>{bill.items?.length || 0}</td>
                    <td><span style={{ textTransform: 'capitalize' }}>{bill.paymentMethod}</span></td>
                    <td><strong>₹{Number(bill.totalAmount).toFixed(2)}</strong></td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => handlePrint(bill.id)}>
                        Print Bill
                      </button>
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
    </div>
  );
}
