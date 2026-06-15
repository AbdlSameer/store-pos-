import { QRCodeSVG } from 'qrcode.react';

export default function PrintLabelModal({ product, onClose }: { product: any, onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }} className="no-print">Print Product Label</h2>
        
        <div 
          className="print-area" 
          style={{ 
            border: '2px dashed #cbd5e1', 
            padding: '2rem', 
            borderRadius: '8px',
            textAlign: 'center',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Toy Store</h3>
          <QRCodeSVG value={product.sku} size={128} />
          <div style={{ fontSize: '1.125rem', fontWeight: '500', marginTop: '0.5rem' }}>{product.name}</div>
          <div style={{ fontSize: '1rem', color: '#64748b' }}>SKU: {product.sku}</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.5rem' }}>₹{product.price}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }} className="no-print">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>Print Label</button>
        </div>
      </div>
    </div>
  );
}
