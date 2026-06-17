

export default function PrintBillModal({ bill, onClose }: { bill: any, onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%' }}>
        <h2 className="no-print" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Print Bill</h2>
        
        <div 
          className="print-area" 
          style={{ 
            padding: '2rem', 
            backgroundColor: '#fff',
            fontFamily: 'monospace',
            color: '#000'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>A. M. Mangilal Toy World</h2>
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Cash Memo</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <div>
              <div><strong>Bill No:</strong> {bill.billNumber}</div>
              <div><strong>Cashier:</strong> {bill.cashier?.fullName || 'Admin'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div><strong>Date:</strong> {new Date(bill.createdAt).toLocaleString()}</div>
              {bill.customerName && <div><strong>Customer:</strong> {bill.customerName}</div>}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed #000', borderTop: '1px dashed #000' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Item (SKU)</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>MRP</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Rate</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items?.map((item: any) => (
                <tr key={item.id}>
                  <td style={{ padding: '0.25rem 0' }}>
                    <div>{item.productName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>{item.productSku}</div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.25rem 0' }}>
                    {item.mrp ? `₹${Number(item.mrp).toFixed(2)}` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.25rem 0' }}>₹{Number(item.unitPrice).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '0.25rem 0' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '0.25rem 0' }}>₹{Number(item.lineTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px dashed #000', paddingTop: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ width: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Subtotal:</span>
                <span>₹{Number(bill.subtotal).toFixed(2)}</span>
              </div>
              {Number(bill.discountValue) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Discount:</span>
                  <span>-₹{bill.discountType === 'flat' ? Number(bill.discountValue).toFixed(2) : ((Number(bill.subtotal) * Number(bill.discountValue)) / 100).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.125rem', borderTop: '1px solid #000', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                <span>Grand Total:</span>
                <span>₹{Number(bill.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <div>Payment Method: {bill.paymentMethod.toUpperCase()}</div>
            <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Thank you for shopping with us!</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }} className="no-print">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>Print Receipt</button>
        </div>
      </div>
    </div>
  );
}
