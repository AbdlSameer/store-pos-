import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Plus, Search, Edit, Trash2, Printer } from 'lucide-react';
import AddProductModal from '../components/AddProductModal';
import PrintLabelModal from '../components/PrintLabelModal';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [labelProduct, setLabelProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products?search=${search}`);
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to delete product');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Products Inventory</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18}/> Add Product</button>
      </div>

      {isModalOpen && <AddProductModal onClose={() => setIsModalOpen(false)} onProductAdded={fetchProducts} />}
      {editingProduct && <AddProductModal initialData={editingProduct} onClose={() => setEditingProduct(null)} onProductAdded={fetchProducts} />}
      {labelProduct && <PrintLabelModal product={labelProduct} onClose={() => setLabelProduct(null)} />}

      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search by name or SKU..." 
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>SKU</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Name</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Price</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Wholesale</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Stock</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 1.5rem' }}>{p.sku}</td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{p.category?.name}</td>
                <td style={{ padding: '1rem 1.5rem' }}>₹{p.price}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{p.wholesalePrice ? `₹${p.wholesalePrice}` : '-'}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: p.quantity <= p.lowStockThreshold ? '#fee2e2' : '#dcfce7',
                    color: p.quantity <= p.lowStockThreshold ? '#ef4444' : '#16a34a'
                  }}>
                    {p.quantity} in stock
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <button style={{ color: 'var(--primary)', marginRight: '0.75rem' }} title="Edit" onClick={() => setEditingProduct(p)}><Edit size={18}/></button>
                  <button style={{ color: '#8b5cf6', marginRight: '0.75rem' }} title="Print Label" onClick={() => setLabelProduct(p)}><Printer size={18}/></button>
                  <button style={{ color: 'var(--danger)' }} title="Delete" onClick={() => handleDelete(p.id)}><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
