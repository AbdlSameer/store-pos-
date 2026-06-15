import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AddProductModal({ onClose, onProductAdded, initialData }: { onClose: () => void, onProductAdded: () => void, initialData?: any }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    sku: initialData?.sku || `TS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    name: initialData?.name || '',
    description: initialData?.description || '',
    categoryId: initialData?.categoryId || '',
    price: initialData?.price?.toString() || '',
    wholesalePrice: initialData?.wholesalePrice?.toString() || '',
    costPrice: initialData?.costPrice?.toString() || '',
    quantity: initialData?.quantity?.toString() || '',
    lowStockThreshold: initialData?.lowStockThreshold?.toString() || '10'
  });

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        wholesalePrice: formData.wholesalePrice ? Number(formData.wholesalePrice) : undefined,
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        quantity: Number(formData.quantity),
        lowStockThreshold: Number(formData.lowStockThreshold)
      };

      if (initialData) {
        await api.patch(`/products/${initialData.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      onProductAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${initialData ? 'update' : 'add'} product`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{initialData ? 'Edit Product' : 'Add New Product'}</h2>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>SKU</label>
              <input required readOnly className="input-field" value={formData.sku} style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select required className="input-field" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="input-field" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Selling Price (₹)</label>
              <input required type="number" step="0.01" className="input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Wholesale Price (₹)</label>
              <input type="number" step="0.01" className="input-field" value={formData.wholesalePrice} onChange={e => setFormData({...formData, wholesalePrice: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Cost Price (₹)</label>
              <input type="number" step="0.01" className="input-field" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Initial Quantity</label>
              <input required type="number" className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Low Stock Alert At</label>
              <input required type="number" className="input-field" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Product')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
