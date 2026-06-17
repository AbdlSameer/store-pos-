import { QRCodeSVG } from 'qrcode.react';

export default function PrintLabelModal({ product, onClose }: { product: any, onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  const labels = Array.from({ length: 9 });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }} className="no-print">Print Product Labels (9 per page)</h2>
        
        <div className="print-area">
          <div className="label-grid">
            {labels.map((_, i) => (
              <div key={i} className="label-cell">
                <div className="label-shop-name">A. M. Mangilal Toy World</div>
                <QRCodeSVG value={product.sku} size={120} />
                <div className="label-product-name">{product.name}</div>
                <div className="label-sku">SKU: {product.sku}</div>
                {product.mrp && <div className="label-mrp">MRP: ₹{product.mrp}</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }} className="no-print">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>Print Labels</button>
        </div>
      </div>
    </div>
  );
}
