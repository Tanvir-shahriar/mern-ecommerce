import { ArrowRight, ShieldCheck, Timer, Truck, WalletCards } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard.jsx';
import { api } from '../services/api.js';

const perks = [
  { icon: Timer, label: 'Watch-first catalog' },
  { icon: ShieldCheck, label: 'Secure checkout' },
  { icon: Truck, label: 'Tracked delivery' },
  { icon: WalletCards, label: 'Flexible payment' }
];

export const HomePage = () => {
  const { data: featuredData, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await api.get('/products/featured', { params: { limit: 8 } });
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

  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow light brand-eyebrow">
            <span className="inline-brand">
              lah<span className="brand-v">V</span>enture
            </span>{' '}
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
        <div className="hero-media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1100&q=85"
            alt=""
          />
          <div className="hero-specs">
            <span>Smart health tracking</span>
            <span>Classic automatic styles</span>
            <span>Premium straps</span>
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

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Categories</p>
            <h2>Shop by collection</h2>
          </div>
          <Link to="/products" className="text-link">
            View all
          </Link>
        </div>
        <div className="category-grid">
          {categories.slice(0, 4).map((category) => (
            <Link to={`/products?category=${category.slug}`} className="category-tile" key={category._id}>
              <strong>{category.name}</strong>
              <span>{category.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured</p>
            <h2>
              <span className="inline-brand">
                lah<span className="brand-v">V</span>enture
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
