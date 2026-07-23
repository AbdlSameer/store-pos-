import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function PrintLabelModal({ product, onClose }: { product: any, onClose: () => void }) {
  const [format, setFormat] = useState<'2x4' | '3x6'>('2x4'); // 2x4 = 8 labels, 3x6 = 18 labels

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cols = format === '2x4' ? 2 : 3;
    const rows = format === '2x4' ? 4 : 6;
    const qrSize = format === '2x4' ? 130 : 60;
    const cellWidth = format === '2x4' ? '95mm' : '63.3mm';
    const cellHeight = format === '2x4' ? '69.25mm' : '46.1mm';
    const shopFontSize = format === '2x4' ? '9pt' : '7pt';
    const prodFontSize = format === '2x4' ? '8pt' : '6pt';
    const skuFontSize = format === '2x4' ? '7pt' : '5pt';
    const mrpFontSize = format === '2x4' ? '10pt' : '8pt';

    // Build label HTML for every label in bulk
    const labelHTML = pages.map(pageLabels => `
      <div class="label-page">
        <div class="label-grid">
          ${pageLabels.map(() => `
            <div class="label-cell">
              <div class="label-shop-name">A. M. Mangilal Toy World</div>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(product.qrCode?.qrPayload || product.sku)}"
                width="${qrSize}" height="${qrSize}"
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
            grid-template-columns: repeat(${cols}, 1fr);
            grid-template-rows: repeat(${rows}, 1fr);
            gap: 0;
          }
          .label-page:last-child { page-break-after: avoid; }
          .label-grid { display: contents; }
          .label-cell {
            border: 0.5pt solid #999;
            width: ${cellWidth};
            height: ${cellHeight};
            padding: 2mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1mm;
            overflow: hidden;
          }
          .label-shop-name { font-size: ${shopFontSize}; font-weight: 700; text-align: center; }
          .label-product-name { font-size: ${prodFontSize}; font-weight: 600; text-align: center; }
          .label-sku { font-size: ${skuFontSize}; color: #333; }
          .label-mrp { font-size: ${mrpFontSize}; font-weight: 700; }
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
  const labelsPerPage = format === '2x4' ? 8 : 18;
  const totalPages = Math.ceil(totalLabels / labelsPerPage);

  // Build pages
  const pages = Array.from({ length: totalPages }, (_, pageIndex) => {
    const startIdx = pageIndex * labelsPerPage;
    const count = Math.min(labelsPerPage, totalLabels - startIdx);
    return Array.from({ length: count });
  });

  const previewCols = format === '2x4' ? 2 : 3;
  const previewRows = format === '2x4' ? 4 : 6;
  const qrSize = format === '2x4' ? 130 : 60;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }} className="no-print">Print Product Labels</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }} className="no-print">
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {totalLabels} labels ({totalPages} page{totalPages > 1 ? 's' : ''})
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Format:</label>
            <select className="input-field" style={{ padding: '0.25rem 0.5rem', width: 'auto' }} value={format} onChange={e => setFormat(e.target.value as any)}>
              <option value="2x4">8 Labels (2 cols x 4 rows)</option>
              <option value="3x6">18 Labels (3 cols x 6 rows)</option>
            </select>
          </div>
        </div>
        
        <div className="print-area">
          {pages.map((pageLabels, pageIdx) => (
            <div key={pageIdx} className="label-page" style={{ 
              display: 'grid', 
              gridTemplateColumns: \`repeat(\${previewCols}, 1fr)\`, 
              gridTemplateRows: \`repeat(\${previewRows}, 1fr)\`
            }}>
              <div className="label-grid" style={{ display: 'contents' }}>
                {pageLabels.map((_, i) => (
                  <div key={i} className="label-cell" style={{
                    border: '1px solid #ccc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    minHeight: format === '2x4' ? '180px' : '100px'
                  }}>
                    <div className="label-shop-name" style={{ fontSize: format === '2x4' ? '0.8rem' : '0.6rem', fontWeight: 'bold' }}>A. M. Mangilal Toy World</div>
                    <QRCodeSVG value={product.sku} size={qrSize} />
                    <div className="label-product-name" style={{ fontSize: format === '2x4' ? '0.75rem' : '0.5rem' }}>{product.name}</div>
                    <div className="label-sku" style={{ fontSize: format === '2x4' ? '0.65rem' : '0.45rem' }}>SKU: {product.sku}</div>
                    {product.mrp && <div className="label-mrp" style={{ fontSize: format === '2x4' ? '0.9rem' : '0.7rem', fontWeight: 'bold' }}>MRP: ₹{product.mrp}</div>}
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

