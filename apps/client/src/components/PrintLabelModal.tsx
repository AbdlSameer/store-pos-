import { QRCodeSVG } from 'qrcode.react';

export default function PrintLabelModal({ product, onClose }: { product: any, onClose: () => void }) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build label HTML for every label in bulk
    const labelHTML = pages.map(pageLabels => `
      <div class="label-page">
        <div class="label-grid">
          ${pageLabels.map(() => `
            <div class="label-cell">
              <div class="label-shop-name">A. M. Mangilal Toy World</div>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(product.qrCode?.qrPayload || product.sku)}"
                width="130" height="130"
              />
              <div class="label-product-name">${product.name}</div>
              <div class="label-sku">SKU: ${product.sku}</div>
              ${product.mrp ? `<div class="label-mrp">MRP: \u20B9${product.mrp}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Labels - ${product.name}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
          body { background: white; }
          .label-page {
            width: 190mm;
            height: 277mm;
            page-break-after: always;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(4, 1fr);
            gap: 0;
          }
          .label-page:last-child { page-break-after: avoid; }
          .label-grid { display: contents; }
          .label-cell {
            border: 0.5pt solid #999;
            width: 95mm;
            height: 69.25mm;
            padding: 3mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.5mm;
            overflow: hidden;
          }
          .label-shop-name { font-size: 9pt; font-weight: 700; text-align: center; }
          .label-product-name { font-size: 8pt; font-weight: 600; text-align: center; }
          .label-sku { font-size: 7pt; color: #333; }
          .label-mrp { font-size: 10pt; font-weight: 700; }
        </style>
      </head>
      <body>
        ${labelHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    // Wait for QR images to load then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
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
