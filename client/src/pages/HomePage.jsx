import { ArrowRight, ShieldCheck, Truck, WalletCards } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard.jsx';
import { api } from '../services/api.js';

const perks = [
  { icon: Truck, label: 'Fast shipping' },
  { icon: ShieldCheck, label: 'Secure checkout' },
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
          <p className="eyebrow light">New season edit</p>
          <h1>Northstar Commerce</h1>
          <p>
            Shop durable tech, home goods, apparel, and wellness essentials with a clean checkout
            and live order tracking.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/products">
              Shop catalog
              <ArrowRight size={18} />
            </Link>
            <Link className="button glass" to="/account">
              My orders
            </Link>
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
            <h2>Shop by department</h2>
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
            <h2>Popular picks</h2>
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
