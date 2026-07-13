import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { Seo } from '../components/Seo.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { api } from '../services/api.js';

const toParamsObject = (searchParams) => Object.fromEntries(searchParams.entries());

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebouncedValue(search);
  const params = useMemo(() => toParamsObject(searchParams), [searchParams]);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchParams.get('search')) count++;
    if (searchParams.get('category')) count++;
    if (searchParams.get('brand')) count++;
    if (searchParams.get('minPrice')) count++;
    if (searchParams.get('maxPrice')) count++;
    if (searchParams.get('inStock') === 'true') count++;
    return count;
  }, [searchParams]);
  const { currency, convertToBase } = useCurrency();
  const apiParams = useMemo(() => {
    const next = { ...params };
    delete next.page;
    if (params.minPrice) next.minPrice = convertToBase(params.minPrice);
    if (params.maxPrice) next.maxPrice = convertToBase(params.maxPrice);
    return next;
  }, [convertToBase, params]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    next.delete('page');
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

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await api.get('/brands');
      return data.data.brands;
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['product-sections', apiParams],
    queryFn: async () => {
      const { data } = await api.get('/products/sections', { params: apiParams });
      return data.data;
    }
  });

  const { data: topPicks = [] } = useQuery({
    queryKey: ['top-picks-products'],
    queryFn: async () => {
      const { data } = await api.get('/products/top-picks');
      return data.data.products;
    }
  });

  const { data: hotDeals = [] } = useQuery({
    queryKey: ['hot-deals-products'],
    queryFn: async () => {
      const { data } = await api.get('/products/hot-deals');
      return data.data.products;
    }
  });

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const sections = data?.sections || [];
  const products = sections.flatMap((section) => section.products || []);
  const totalProducts = data?.totalProducts ?? products.length;
  const fallbackBrandOptions = (data?.filters?.brands || []).map((brand) => ({ name: brand, slug: brand }));
  const brandOptions = brands.length ? brands : fallbackBrandOptions;

  const currentCategorySlug = searchParams.get('category');
  const currentBrand = searchParams.get('brand');
  const activeCategoryObj = categories.find((c) => c.slug === currentCategorySlug);
  const activeBrandObj = brandOptions.find((brand) => brand.slug === currentBrand || brand.name === currentBrand);
  const sectionCategoryOptions = sections.map((section) => ({
    ...section.category,
    productCount: section.products?.length || 0
  }));
  const categoryFilterOptions = sectionCategoryOptions.length ? sectionCategoryOptions : categories;
  const visibleCategoryOptions = currentCategorySlug && activeCategoryObj && !categoryFilterOptions.some((category) => category.slug === currentCategorySlug)
    ? [activeCategoryObj, ...categoryFilterOptions]
    : categoryFilterOptions;
  const categoryName = activeCategoryObj?.name || (currentCategorySlug ? currentCategorySlug.toUpperCase() : '');
  const brandName = activeBrandObj?.name || currentBrand || '';

  let pageTitle = 'SHOP NOW';
  if (search) {
    pageTitle = `Search results for "${search}"`;
  } else if (brandName) {
    pageTitle = `${brandName} Collection`;
  } else if (categoryName) {
    pageTitle = `${categoryName} Collection`;
  }

  const catalogSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': pageTitle,
    'description': `Browse authentic ${brandName || categoryName || 'luxury'} products at LahVenture.`,
    'url': window.location.href,
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': products.length,
      'itemListElement': products.map((prod, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'url': `${window.location.origin}/products/${prod.slug || prod._id}`
      }))
    }
  };

  const jumpToCategory = (category) => {
    const target = document.getElementById(`category-${category.slug || category._id}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="catalog-page">
      <Seo
        title={pageTitle}
        description={`Explore our curated collection of ${brandName || categoryName || 'luxury'} products with guaranteed authenticity and fast delivery.`}
        schemaJson={catalogSchema}
      />
      {/* Mobile Filters UI */}
      <div className="mobile-filters-container mobile-only">
        {/* Category Pills */}
        <div className="mobile-category-pills">
          <button
            type="button"
            className={`pill-button ${!currentCategorySlug ? 'active' : ''}`}
            onClick={() => updateFilter('category', 'all')}
          >
            All
          </button>
          {visibleCategoryOptions.map((category) => (
            <button
              type="button"
              className={`pill-button ${currentCategorySlug === category.slug ? 'active' : ''}`}
              key={category._id}
              onClick={() => updateFilter('category', category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="mobile-filter-bar">
          <button
            type="button"
            className={`mobile-filter-toggle-btn ${activeFiltersCount > 0 ? 'has-active' : ''}`}
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <SlidersHorizontal size={16} />
            <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
          </button>

          <div className="mobile-sort-wrapper">
            <select
              value={searchParams.get('sort') || 'newest'}
              onChange={(event) => updateFilter('sort', event.target.value)}
              aria-label="Sort products"
            >
              <option value="newest">Sort: Newest</option>
              <option value="popular">Sort: Popular</option>
              <option value="rating">Sort: Top rated</option>
              <option value="price-asc">Sort: Price Low-High</option>
              <option value="price-desc">Sort: Price High-Low</option>
            </select>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {mobileFiltersOpen && (
          <div className="mobile-advanced-filters-panel">
            <label>
              Search
              <div className="search-field">
                <Search size={16} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products, SKU, brand"
                />
                {search ? (
                  <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
                    <X size={15} />
                  </button>
                ) : null}
              </div>
            </label>

            <div className="price-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label>
                Min Price
                <input
                  type="number"
                  min="0"
                  value={searchParams.get('minPrice') || ''}
                  onChange={(event) => updateFilter('minPrice', event.target.value)}
                  placeholder={currency}
                />
              </label>
              <label>
                Max Price
                <input
                  type="number"
                  min="0"
                  value={searchParams.get('maxPrice') || ''}
                  onChange={(event) => updateFilter('maxPrice', event.target.value)}
                  placeholder={currency}
                />
              </label>
            </div>

            <label>
              Brand
              <select value={searchParams.get('brand') || 'all'} onChange={(event) => updateFilter('brand', event.target.value)}>
                <option value="all">All brands</option>
                {brandOptions.map((brand) => (
                  <option value={brand.slug || brand.name} key={brand._id || brand.slug || brand.name}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: '4px 0' }}>
              <input
                type="checkbox"
                checked={searchParams.get('inStock') === 'true'}
                onChange={(event) => updateFilter('inStock', event.target.checked ? 'true' : '')}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <span>In stock only</span>
            </label>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                className="button secondary compact full"
                onClick={() => {
                  const next = new URLSearchParams();
                  setSearchParams(next);
                  setSearch('');
                  setMobileFiltersOpen(false);
                }}
                style={{ marginTop: '4px' }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      <aside className="filters-panel desktop-only">
        <div className="panel-title">
          <SlidersHorizontal size={18} />
          <strong>Filters</strong>
        </div>
        <label>
          Search
          <div className="search-field">
            <Search size={16} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, SKU, brand" />
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
            {visibleCategoryOptions.map((category) => (
              <option value={category.slug} key={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Brand
          <select value={searchParams.get('brand') || 'all'} onChange={(event) => updateFilter('brand', event.target.value)}>
            <option value="all">All brands</option>
            {brandOptions.map((brand) => (
              <option value={brand.slug || brand.name} key={brand._id || brand.slug || brand.name}>
                {brand.name}
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
            <h1>{pageTitle || 'Shop watches'}</h1>
            {params.search ? <span className="search-meta">{totalProducts} result(s) for "{params.search}"</span> : null}
          </div>
          <select value={searchParams.get('sort') || 'newest'} onChange={(event) => updateFilter('sort', event.target.value)} aria-label="Sort products" className="desktop-only">
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="rating">Top rated</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>

        {!isLoading && sections.length ? (
          <>
            <div className="catalog-insight-row">
              <span>{totalProducts} item{totalProducts === 1 ? '' : 's'}</span>
              <span>{sections.length} categor{sections.length === 1 ? 'y' : 'ies'}</span>
              {brandName ? <span>{brandName}</span> : null}
              {categoryName ? <span>{categoryName}</span> : null}
            </div>

            <div className="catalog-category-jump" aria-label="Product categories">
              {sections.map((section) => (
                <button
                  type="button"
                  key={section.category._id}
                  className={currentCategorySlug === section.category.slug ? 'active' : ''}
                  onClick={() => jumpToCategory(section.category)}
                >
                  <span>{section.category.name}</span>
                  <strong>{section.products.length}</strong>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {!isLoading && activeFiltersCount === 0 && hotDeals && hotDeals.length > 0 && (
          <div className="hot-deals-section" style={{ marginBottom: '40px' }}>
            <div
              className="hot-deals-banner"
              style={{
                background: '#FAF6F0',
                border: '1px solid rgba(194, 125, 56, 0.1)',
                padding: '20px 20px',
                textAlign: 'center',
                borderRadius: '4px',
                marginBottom: '24px'
              }}
            >
              <h2 style={{ color: '#C27D38', margin: 0, textTransform: 'uppercase', letterSpacing: '4px', fontSize: '15px', fontWeight: 'bold' }}>
                HOT DEALS
              </h2>
            </div>
            <div className="product-grid" style={{ marginBottom: '24px' }}>
              {hotDeals.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && activeFiltersCount === 0 && topPicks && topPicks.length > 0 && (
          <div className="top-picks-section" style={{ marginBottom: '40px' }}>
            <div
              className="top-picks-banner"
              style={{
                background: '#FAF6F0',
                border: '1px solid rgba(194, 125, 56, 0.1)',
                padding: '20px 20px',
                textAlign: 'center',
                borderRadius: '4px',
                marginBottom: '24px'
              }}
            >
              <h2 style={{ color: '#C27D38', margin: 0, textTransform: 'uppercase', letterSpacing: '4px', fontSize: '15px', fontWeight: 'bold' }}>
                Our Top pick
              </h2>
            </div>
            <div className="product-grid" style={{ marginBottom: '24px' }}>
              {topPicks.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, index) => <div className="skeleton-card" key={index} />)}
          </div>
        ) : sections.length ? (
          <div className="catalog-sections-stack">
            {sections.map((section) => (
              <section
                className="catalog-category-section"
                id={`category-${section.category.slug || section.category._id}`}
                key={section.category._id}
              >
                <div className="catalog-category-heading">
                  <div>
                    <p className="eyebrow">Category</p>
                    <h2>{section.category.name}</h2>
                    {section.category.description ? <p>{section.category.description}</p> : null}
                  </div>
                  <div className="catalog-category-actions">
                    <span>{section.products.length} item{section.products.length === 1 ? '' : 's'}</span>
                    {!currentCategorySlug ? (
                      <button type="button" className="button secondary compact" onClick={() => updateFilter('category', section.category.slug)}>
                        View category
                        <ArrowRight size={15} />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="product-grid catalog-section-grid">
                  {section.products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState title="No products found" message="Try another search or clear a filter." actionLabel="Reset filters" actionTo="/products" />
        )}
      </div>
    </section>
  );
};
