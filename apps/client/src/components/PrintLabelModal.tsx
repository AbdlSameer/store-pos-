import { QRCodeSVG } from 'qrcode.react';

export default function PrintLabelModal({ product, onClose }: { product: any, onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  const totalLabels = product.quantity || 1;
  const labelsPerPage = 8;
  const totalPages = Math.ceil(totalLabels / labelsPerPage);

  // Build pages, each containing up to 8 labels
  const pages = Array.from({ length: totalPages }, (_, pageIndex) => {
    const startIdx = pageIndex * labelsPerPage;
    const count = Math.min(labelsPerPage, totalLabels - startIdx);
    return Array.from({ length: count });
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }} className="no-print">Print Product Labels</h2>
        <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }} className="no-print">
          {totalLabels} labels ({totalPages} page{totalPages > 1 ? 's' : ''}) — based on stock quantity
        </p>
        
        <div className="print-area">
          {pages.map((pageLabels, pageIdx) => (
            <div key={pageIdx} className="label-page">
              <div className="label-grid">
                {pageLabels.map((_, i) => (
                  <div key={i} className="label-cell">
                    <div className="label-shop-name">A. M. Mangilal Toy World</div>
                    <QRCodeSVG value={product.sku} size={130} />
                    <div className="label-product-name">{product.name}</div>
                    <div className="label-sku">SKU: {product.sku}</div>
                    {product.mrp && <div className="label-mrp">MRP: ₹{product.mrp}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }} className="no-print">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>Print {totalLabels} Labels</button>
        </div>
      </div>
    </div>
  );
}
