import { ArrowRight, Cpu, CreditCard, ShieldCheck, Timer, Truck, WalletCards } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api, mediaUrl } from '../services/api.js';
import { directCheckoutUrl, startDirectCheckout } from '../utils/directCheckout.js';
import { money } from '../utils/format.js';

const perks = [
  { icon: Timer, label: 'Watch-first catalog' },
  { icon: ShieldCheck, label: 'Secure checkout' },
  { icon: Truck, label: 'Tracked delivery' },
  { icon: WalletCards, label: 'Flexible payment' }
];

const chineseWatchBrands = [
  { name: 'Sea-Gull', mark: 'SG', type: 'Tianjin watchmaking' },
  { name: 'Shanghai Watch', mark: 'SH', type: 'Classic mechanical' },
  { name: 'Beijing Watch', mark: 'BJ', type: 'Heritage atelier' },
  { name: 'Fiyta', mark: 'FY', type: 'Aerospace inspired' },
  { name: 'Rossini', mark: 'RS', type: 'Dress watches' },
  { name: 'Ebohr', mark: 'EB', type: 'Modern automatics' },
  { name: 'Tian Wang', mark: 'TW', type: 'Mainstream collection' },
  { name: 'Peacock', mark: 'PK', type: 'Movement maker' },
  { name: 'CIGA Design', mark: 'CG', type: 'Design watches' },
  { name: 'Memorigin', mark: 'MO', type: 'Tourbillon craft' },
  { name: 'San Martin', mark: 'SM', type: 'Diver specialists' },
  { name: 'Sugess', mark: 'SU', type: 'Mechanical chronos' },
  { name: 'Pagani Design', mark: 'PD', type: 'Sport watches' },
  { name: 'Cadisen', mark: 'CD', type: 'Value automatics' },
  { name: 'Berny', mark: 'BY', type: 'Tool watches' },
  { name: 'Addiesdive', mark: 'AD', type: 'Dive watches' },
  { name: 'Heimdallr', mark: 'HD', type: 'Sapphire divers' },
  { name: 'Proxima', mark: 'PX', type: 'Enthusiast divers' },
  { name: 'Cronos', mark: 'CR', type: 'Premium homage' },
  { name: 'Baltany', mark: 'BT', type: 'Vintage field' },
  { name: 'Merkur', mark: 'MK', type: 'Retro mechanical' },
  { name: 'Tandorio', mark: 'TD', type: 'Custom builds' },
  { name: 'Guanqin', mark: 'GQ', type: 'Dress automatics' },
  { name: 'Lobinni', mark: 'LB', type: 'Elegant mechanical' }
];

export const HomePage = () => {
  const [heroIndex, setHeroIndex] = useState(0);
  const [purchaseId, setPurchaseId] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: featuredData, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await api.get('/products/featured', { params: { limit: 8 } });
      return data.data.products;
    }
  });

  const heroProducts = useMemo(
    () => (featuredData || []).filter((product) => product.images?.[0]?.url).slice(0, 6),
    [featuredData]
  );
  const activeHeroIndex = heroProducts.length ? heroIndex % heroProducts.length : 0;
  const activeHeroProduct = heroProducts[activeHeroIndex];
  const futureProducts = heroProducts.slice(0, 3);

  useEffect(() => {
    setHeroIndex(0);
  }, [heroProducts.length]);

  useEffect(() => {
    if (heroProducts.length < 2) return undefined;

    const interval = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % heroProducts.length);
    }, 4800);

    return () => window.clearInterval(interval);
  }, [heroProducts.length]);

  const purchaseNow = (product) => {
    setPurchaseId(product._id);
    startDirectCheckout({ productId: product._id, quantity: 1 });

    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout', search: '?mode=buy-now' } } });
      return;
    }

    navigate(directCheckoutUrl);
  };

  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow light brand-eyebrow">
            <span className="inline-brand">
              lahVenture
            </span>{'  '}
            watches
          </p>
          <h1>Timepieces for work, sport, and every journey.</h1>
          <p>
            Discover classic watches, smartwatches, straps, and wearable accessories with secure
            checkout, live order tracking, and inventory managed from one admin system.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/products">
              Shop watches
              <ArrowRight size={18} />
            </Link>
            <Link className="button glass" to="/account">
              My orders
            </Link>
          </div>
        </div>
        <div className="hero-media">
          {activeHeroProduct ? (
            <>
              <Link
                className="hero-product-slide"
                to={`/products/${activeHeroProduct.slug || activeHeroProduct._id}`}
                key={activeHeroProduct._id}
                aria-label={`View ${activeHeroProduct.name}`}
              >
                <img
                  src={mediaUrl(activeHeroProduct.images?.[0]?.url)}
                  alt={activeHeroProduct.images?.[0]?.alt || activeHeroProduct.name}
                />
                <div className="hero-product-overlay">
                  <span>{activeHeroProduct.brand || activeHeroProduct.category?.name}</span>
                  <strong>{activeHeroProduct.name}</strong>
                  <em>{money(activeHeroProduct.price)}</em>
                </div>
              </Link>
              <div className="hero-carousel-controls" aria-label="Featured product carousel">
                {heroProducts.map((product, index) => (
                  <button
                    type="button"
                    className={index === activeHeroIndex ? 'active' : ''}
                    key={product._id}
                    onClick={() => setHeroIndex(index)}
                    aria-label={`Show ${product.name}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="hero-product-slide hero-product-loading">
              <span className="spinner" />
            </div>
          )}
          <div className="hero-specs">
            <span>Smart health tracking</span>
            <span>Classic automatic styles</span>
            <span>Premium straps</span>
          </div>
        </div>
      </section>

      <section className="future-showcase-section">
        <div className="future-showcase-inner">
          <div className="future-showcase-heading">
            <div>
              <h2>Picks built for the next move.</h2>
            </div>
            <Link className="button glass future-catalog-link" to="/products?featured=true">
              Explore all
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="future-product-grid">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => <div className="future-product-card loading" key={index} />)
              : futureProducts.map((product, index) => {
                  const productTo = `/products/${product.slug || product._id}`;
                  const inStock = !product.inventory?.trackQuantity || product.inventory.stock > 0;
                  const isPurchasing = purchaseId === product._id;
                  const stockLabel = product.inventory?.trackQuantity ? `${product.inventory.stock} in stock` : 'Ready to ship';

                  return (
                    <article className="future-product-card" style={{ '--delay': `${index * 90}ms` }} key={product._id}>
                      <Link className="future-product-media" to={productTo}>
                        <img src={mediaUrl(product.images?.[0]?.url)} alt={product.images?.[0]?.alt || product.name} />
                        <span>
                          <Cpu size={15} />
                          {product.category?.name || product.brand || 'lahVenture'}
                        </span>
                      </Link>
                      <div className="future-product-body">
                        <Link to={productTo} className="future-product-title">
                          {product.name}
                        </Link>
                        <p>{product.shortDescription || product.description}</p>
                        <div className="future-product-meta">
                          <div>
                            <strong>{money(product.price)}</strong>
                            {product.compareAtPrice ? <span>{money(product.compareAtPrice)}</span> : null}
                          </div>
                          <em>{inStock ? stockLabel : 'Out of stock'}</em>
                        </div>
                      </div>
                      <button
                        className="future-purchase-button"
                        type="button"
                        onClick={() => purchaseNow(product)}
                        disabled={!inStock || isPurchasing}
                      >
                        {isPurchasing ? <span className="spinner tiny" /> : <CreditCard size={17} />}
                        {isPurchasing ? 'Processing' : 'Purchase now'}
                      </button>
                    </article>
                  );
                })}
          </div>
        </div>
      </section>

      <section className="perks-bar">
        {perks.map(({ icon: Icon, label }) => (
          <div key={label}>
            <Icon size={20} />
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="brand-showcase-section">
        <div className="brand-showcase-heading">
          <p className="eyebrow">Shop by brand</p>
          <h2>Explore Chinese watch brands</h2>
          <p>
            Browse heritage Chinese watchmakers and enthusiast-favorite microbrands, from classic
            mechanical maisons to modern sport-watch specialists.
          </p>
        </div>
        <div className="brand-marquee" aria-label="Popular Chinese watch brands">
          <div className="brand-marquee-track">
            {[...chineseWatchBrands, ...chineseWatchBrands].map((brand, index) => (
              <Link
                className="brand-logo-card"
                to={`/products?brand=${encodeURIComponent(brand.name)}`}
                key={`${brand.name}-${index}`}
              >
                <span className="brand-card-mark">{brand.mark}</span>
                <strong>{brand.name}</strong>
                <small>{brand.type}</small>
              </Link>
            ))}
          </div>
        </div>
        <Link to="/products" className="button brand-view-button">
          View all brands
        </Link>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured</p>
            <h2>
              <span className="inline-brand">
                lah<span className="brand-v">Venture</span>
              </span>{' '}
              picks
            </h2>
          </div>
          <Link to="/products?featured=true" className="text-link">
            More picks
          </Link>
        </div>
        <div className="product-grid">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => <div className="skeleton-card" key={index} />)
            : featuredData?.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>
    </>
  );
};
