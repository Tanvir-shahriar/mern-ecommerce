import { Archive, ArrowDown, ArrowUp, Edit3, Minus, PackagePlus, Plus, Save, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
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
  const [categoryOrderDrafts, setCategoryOrderDrafts] = useState({});
  const [savingCategoryOrder, setSavingCategoryOrder] = useState(false);
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

  useEffect(() => {
    setCategoryOrderDrafts((current) => {
      const next = {};
      categories.forEach((category, index) => {
        next[category._id] = current[category._id] ?? category.order ?? index + 1;
      });
      return next;
    });
  }, [categories]);

  const orderedCategories = useMemo(() => {
    const draftOrder = (category) => {
      const value = Number(categoryOrderDrafts[category._id] ?? category.order ?? 0);
      return Number.isFinite(value) ? value : 0;
    };

    return [...categories]
      .map((category) => ({ ...category, draftOrder: draftOrder(category) }))
      .sort((first, second) => first.draftOrder - second.draftOrder || first.name.localeCompare(second.name));
  }, [categories, categoryOrderDrafts]);

  const hasCategoryOrderChanges = useMemo(
    () => categories.some((category) => Number(categoryOrderDrafts[category._id] ?? category.order ?? 0) !== Number(category.order ?? 0)),
    [categories, categoryOrderDrafts]
  );

  const createCategory = async (event) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    try {
      const nextOrder = categories.length
        ? Math.max(...categories.map((category) => Number(category.order || 0))) + 1
        : 1;
      await api.post('/categories', { name: categoryName, order: nextOrder });
      setCategoryName('');
      setMessage('Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['product-sections'] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  const moveCategory = (categoryId, direction) => {
    setCategoryOrderDrafts((current) => {
      const sorted = [...categories]
        .map((category) => {
          const value = Number(current[category._id] ?? category.order ?? 0);
          return {
            ...category,
            draftOrder: Number.isFinite(value) ? value : 0
          };
        })
        .sort((first, second) => first.draftOrder - second.draftOrder || first.name.localeCompare(second.name));
      const index = sorted.findIndex((category) => category._id === categoryId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return current;

      const nextSorted = [...sorted];
      [nextSorted[index], nextSorted[targetIndex]] = [nextSorted[targetIndex], nextSorted[index]];

      return nextSorted.reduce((next, category, categoryIndex) => {
        next[category._id] = categoryIndex + 1;
        return next;
      }, { ...current });
    });
  };

  const updateCategoryOrderDraft = (categoryId, value) => {
    setCategoryOrderDrafts((current) => ({
      ...current,
      [categoryId]: value
    }));
  };

  const saveCategoryOrder = async () => {
    const changedCategories = categories.filter(
      (category) => Number(categoryOrderDrafts[category._id] ?? category.order ?? 0) !== Number(category.order ?? 0)
    );
    if (!changedCategories.length) return;

    setSavingCategoryOrder(true);
    setMessage('');
    try {
      await Promise.all(
        changedCategories.map((category) =>
          api.patch(`/categories/${category._id}`, {
            order: Number(categoryOrderDrafts[category._id] ?? category.order ?? 0)
          })
        )
      );
      setMessage('Category order updated');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['product-sections'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    } finally {
      setSavingCategoryOrder(false);
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
      queryClient.invalidateQueries({ queryKey: ['product-sections'] });
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
      queryClient.invalidateQueries({ queryKey: ['product-sections'] });
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
      {message ? (
        <p className={/created|updated|archived|stock/i.test(message) ? 'form-note admin-products-message' : 'form-error admin-products-message'}>
          {message}
        </p>
      ) : null}

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

          <div className="panel category-order-panel">
            <div className="panel-heading">
              <h2>Shop category order</h2>
              <span>{orderedCategories.length} categories</span>
            </div>
            {orderedCategories.length ? (
              <>
                <div className="category-order-list">
                  {orderedCategories.map((category, index) => (
                    <div className="category-order-row" key={category._id}>
                      <span className="category-order-position">{index + 1}</span>
                      <div className="category-order-copy">
                        <strong>{category.name}</strong>
                        <span>{category.slug}</span>
                      </div>
                      <input
                        className="category-order-input"
                        type="number"
                        min="0"
                        value={categoryOrderDrafts[category._id] ?? category.order ?? 0}
                        onChange={(event) => updateCategoryOrderDraft(category._id, event.target.value)}
                        aria-label={`Shop order for ${category.name}`}
                      />
                      <div className="category-order-controls">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => moveCategory(category._id, -1)}
                          disabled={index === 0}
                          aria-label={`Move ${category.name} up`}
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => moveCategory(category._id, 1)}
                          disabled={index === orderedCategories.length - 1}
                          aria-label={`Move ${category.name} down`}
                        >
                          <ArrowDown size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="button dark full" type="button" onClick={saveCategoryOrder} disabled={!hasCategoryOrderChanges || savingCategoryOrder}>
                  <Save size={17} />
                  {savingCategoryOrder ? 'Saving...' : 'Save shop order'}
                </button>
              </>
            ) : (
              <p className="empty-inline-note">Create a category to arrange the shop page.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
