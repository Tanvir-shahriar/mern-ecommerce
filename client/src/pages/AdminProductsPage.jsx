import { Archive, Edit3, Minus, PackagePlus, Plus, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { Seo } from '../components/Seo.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { money } from '../utils/format.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';

const productTypes = [
  { value: 'all', label: 'All product types' },
  { value: 'physical', label: 'Physical products' },
  { value: 'digital', label: 'Digital products' },
  { value: 'service', label: 'Services' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'gift_card', label: 'Gift cards' },
  { value: 'other', label: 'Other' }
];

export const AdminProductsPage = () => {
  const [categoryName, setCategoryName] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();

  const { data: productData, isLoading: productsLoading, isFetching: productsFetching } = useQuery({
    queryKey: ['admin-products', debouncedSearch, statusFilter, typeFilter],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: {
          admin: true,
          limit: 50,
          sort: 'newest',
          search: debouncedSearch || undefined,
          status: statusFilter,
          productType: typeFilter
        }
      });
      return data.data.products;
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data.categories;
    }
  });

  const createCategory = async (event) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    try {
      await api.post('/categories', { name: categoryName });
      setCategoryName('');
      setMessage('Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  const archiveProduct = async (id) => {
    const product = productData?.find((item) => item._id === id);
    if (!window.confirm(`Archive ${product?.name || 'this product'}? It will be removed from the storefront.`)) return;

    try {
      const { data } = await api.delete(`/products/${id}`);
      setMessage(data.message || 'Product archived');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  const updateStock = async (productId, payload) => {
    try {
      const { data } = await api.patch(`/products/${productId}/stock`, payload);
      setMessage(`${data.data.product.name} stock updated to ${data.data.product.inventory.stock}`);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  return (
    <section className="admin-page section">
      <Seo title="Admin Products" noIndex />
      <AdminNav />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Products</h1>
        </div>
        <Link className="button primary" to="/admin/products/new">
          <PackagePlus size={17} />
          Add product
        </Link>
      </div>

      <div className="admin-products-layout">
        <div className="panel">
          <div className="panel-heading">
            <h2>Inventory</h2>
            <span>{productsFetching ? <span className="admin-fetching"><span className="spinner tiny" /> Syncing</span> : `${productData?.length || 0} items`}</span>
          </div>
          <div className="admin-toolbar">
            <label className="search-field">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU, barcode, brand" />
            </label>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Product type">
              {productTypes.map((type) => (
                <option value={type.value} key={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Product status">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {productsLoading ? (
            <AdminLoadingState label="Loading inventory" />
          ) : (
            <div className="admin-product-list">
              {productData?.map((product) => (
                <article className="admin-product-row" key={product._id}>
                  <img src={mediaUrl(product.images?.[0]?.url)} alt={product.name} />
                  <div>
                    <Link to={`/products/${product.slug || product._id}`} className="admin-product-name-link">
                      <strong>{product.name}</strong>
                    </Link>
                    <span>{[product.sku, product.barcode].filter(Boolean).join(' / ')}</span>
                    <span>{product.brand || product.category?.name || product.productType || 'Uncategorized'}</span>
                    <span className={`inventory-status ${product.status}`}>{product.status}</span>
                  </div>
                  <span>{money(product.price)}</span>
                  <div className="stock-controls">
                    <button type="button" onClick={() => updateStock(product._id, { delta: -1 })} aria-label="Decrease stock">
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={product.inventory.stock}
                      onChange={(event) => updateStock(product._id, { stock: Number(event.target.value) })}
                      aria-label={`Stock for ${product.name}`}
                    />
                    <button type="button" onClick={() => updateStock(product._id, { delta: 1 })} aria-label="Increase stock">
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="admin-product-actions">
                    <Link className="icon-button" to={`/admin/products/${product._id}/edit`} aria-label={`Edit ${product.name}`}>
                      <Edit3 size={16} />
                    </Link>
                    <button type="button" className="icon-button" onClick={() => archiveProduct(product._id)} aria-label="Archive product" disabled={product.status === 'archived'}>
                      <Archive size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="stack">
          <form className="form-panel" onSubmit={createCategory}>
            <h2>New category</h2>
            <label>
              Name
              <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
            </label>
            <button className="button dark" type="submit">
              <Plus size={17} />
              Add category
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
