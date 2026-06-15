import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Scan, Camera, Plus, Minus, Trash2, X } from 'lucide-react';

export default function POS() {
  const [cart, setCart] = useState<any[]>([]);
  const [scanPayload, setScanPayload] = useState('');
  const [saleMode, setSaleMode] = useState<'retail' | 'wholesale'>('retail');
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanPayload) return;
    await searchAndAdd(scanPayload);
  };

  const searchAndAdd = async (query: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/products?search=${query}`);
      if (res.data.data.length > 0) {
        addToCart(res.data.data[0]);
      } else {
        alert('Product not found');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setScanPayload('');
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Try using BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a']
        });
        scanIntervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const value = barcodes[0].rawValue;
                stopCamera();
                // If scanned value looks like a SKU (starts with TS-), search directly
                const searchTerm = value.startsWith('TS-') ? value : value;
                await searchAndAdd(searchTerm);
              }
            } catch { /* ignore detection errors */ }
          }
        }, 300);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Could not access camera. Please allow camera permissions or type the SKU manually.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const getItemPrice = (item: any) => {
    return saleMode === 'wholesale' && item.wholesalePrice != null ? Number(item.wholesalePrice) : Number(item.price);
  };

  const subtotal = cart.reduce((acc, item) => acc + (getItemPrice(item) * item.qty), 0);
  const total = subtotal;

  const checkout = async () => {
    try {
      await api.post('/pos/bills', {
        items: cart.map(i => ({ productId: i.id, quantity: i.qty })),
        discountType: 'none',
        discountValue: 0,
        taxRate: 0,
        paymentMethod: 'cash',
        saleMode: saleMode
      });
      alert('Bill Confirmed!');
      setCart([]);
    } catch (err) {
      console.error(err);
      alert('Error during checkout');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', height: '100%' }}>
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>POS Terminal</h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Customer Type:</span>
            <select className="input-field" value={saleMode} onChange={e => setSaleMode(e.target.value as any)} style={{ width: 'auto', padding: '0.5rem' }}>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>
        </div>
        
        <form onSubmit={handleScan} style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <input 
            autoFocus
            className="input-field" 
            placeholder="Scan barcode or enter SKU..." 
            value={scanPayload}
            onChange={e => setScanPayload(e.target.value)}
            style={{ fontSize: '1.25rem', padding: '1rem' }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0 1.5rem' }}>
            <Scan size={24} /> Search
          </button>
          <button type="button" className="btn btn-primary" onClick={startCamera} style={{ padding: '0 1.5rem', backgroundColor: '#8b5cf6' }}>
            <Camera size={24} /> Scan
          </button>
        </form>

        {showCamera && (
          <div style={{ marginBottom: '1.5rem', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--primary)' }}>
            <video ref={videoRef} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} playsInline />
            <button 
              onClick={stopCamera}
              style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
            >
              <X size={18} />
            </button>
            <div style={{ position: 'absolute', bottom: '0.5rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '0.25rem 1rem', borderRadius: '4px', fontSize: '0.875rem' }}>
              Point camera at QR code or barcode
            </div>
          </div>
        )}

        <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Scan items to add to cart
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Item</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Qty</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontWeight: 500 }}>{item.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sku}</p>
                    </td>
                    <td style={{ padding: '1rem' }}>₹{getItemPrice(item)}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => updateQty(item.id, -1)} className="btn" style={{ padding: '0.25rem', backgroundColor: '#f1f5f9' }}><Minus size={16}/></button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="btn" style={{ padding: '0.25rem', backgroundColor: '#f1f5f9' }}><Plus size={16}/></button>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>₹{getItemPrice(item) * item.qty}</td>
                    <td style={{ padding: '1rem' }}>
                      <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} style={{ color: 'var(--danger)' }}><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div className="card" style={{ position: 'sticky', top: '0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Order Summary</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ fontWeight: 500 }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Discount</span>
              <span style={{ fontWeight: 500 }}>₹0.00</span>
            </div>
            <div style={{ borderTop: '2px dashed var(--border)', margin: '0.5rem 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold' }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
            disabled={cart.length === 0}
            onClick={checkout}
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}
