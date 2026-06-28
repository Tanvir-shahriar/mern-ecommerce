import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { api } from '../services/api.js';

const toParamsObject = (searchParams) => Object.fromEntries(searchParams.entries());

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebouncedValue(search);
  const params = useMemo(() => toParamsObject(searchParams), [searchParams]);
  const { currency, convertToBase } = useCurrency();
  const apiParams = useMemo(() => {
    const next = { ...params };
    if (params.minPrice) next.minPrice = convertToBase(params.minPrice);
    if (params.maxPrice) next.maxPrice = convertToBase(params.maxPrice);
    return next;
  }, [convertToBase, params]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    next.set('page', '1');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [debouncedSearch]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data.categories;
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', apiParams],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: apiParams });
      return data.data;
    }
  });

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  const products = data?.products || [];
  const pagination = data?.pagination || { page: 1, pages: 1 };

  return (
    <section className="catalog-page">
      <aside className="filters-panel">
        <div className="panel-title">
          <SlidersHorizontal size={18} />
          <strong>Filters</strong>
        </div>
        <label>
          Search
          <div className="search-field">
            <Search size={16} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search watches, SKU, brand" />
            {search ? (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
                <X size={15} />
              </button>
            ) : null}
          </div>
        </label>
        <label>
          Category
          <select value={searchParams.get('category') || 'all'} onChange={(event) => updateFilter('category', event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option value={category.slug} key={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <div className="price-row">
          <label>
          Min
            <input type="number" min="0" value={searchParams.get('minPrice') || ''} onChange={(event) => updateFilter('minPrice', event.target.value)} placeholder={currency} />
          </label>
          <label>
            Max
            <input type="number" min="0" value={searchParams.get('maxPrice') || ''} onChange={(event) => updateFilter('maxPrice', event.target.value)} placeholder={currency} />
          </label>
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={searchParams.get('inStock') === 'true'}
            onChange={(event) => updateFilter('inStock', event.target.checked ? 'true' : '')}
          />
          In stock
        </label>
      </aside>

      <div className="catalog-content">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Catalog</p>
            <h1>Shop watches</h1>
            {params.search ? <span className="search-meta">{data?.pagination?.total || 0} result(s) for "{params.search}"</span> : null}
          </div>
          <select value={searchParams.get('sort') || 'newest'} onChange={(event) => updateFilter('sort', event.target.value)} aria-label="Sort products">
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="rating">Top rated</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>

        {isLoading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, index) => <div className="skeleton-card" key={index} />)}
          </div>
        ) : products.length ? (
          <>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            <div className="pagination">
              <button disabled={pagination.page <= 1} onClick={() => updateFilter('page', String(pagination.page - 1))}>
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages || 1}
              </span>
              <button disabled={pagination.page >= pagination.pages} onClick={() => updateFilter('page', String(pagination.page + 1))}>
                Next
              </button>
            </div>
          </>
        ) : (
          <EmptyState title="No products found" message="Try another search or clear a filter." actionLabel="Reset filters" actionTo="/products" />
        )}
      </div>
    </section>
  );
};
