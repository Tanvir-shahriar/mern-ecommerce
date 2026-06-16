import { ArrowRight, Cpu, CreditCard, ShieldCheck, Timer, Truck, WalletCards } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import addiesdiveLogo from '../assets/brands/addiesdive.png';
import baltanyLogo from '../assets/brands/baltany.png';
import beijingLogo from '../assets/brands/beijing.png';
import bernyLogo from '../assets/brands/berny.png';
import cadisenLogo from '../assets/brands/cadisen.png';
import cigaLogo from '../assets/brands/ciga.png';
import cronosLogo from '../assets/brands/cronos.png';
import ebohrLogo from '../assets/brands/ebohr.png';
import fiytaLogo from '../assets/brands/fiyta.png';
import guanqinLogo from '../assets/brands/guanqin.webp';
import heimdallrLogo from '../assets/brands/heimdallr.jpg';
import lobinniLogo from '../assets/brands/lobinni.png';
import memoriginLogo from '../assets/brands/memorigin.svg';
import merkurLogo from '../assets/brands/merkur.jpg';
import paganiLogo from '../assets/brands/pagani.png';
import peacockLogo from '../assets/brands/peacock.png';
import proximaLogo from '../assets/brands/proxima.jpg';
import rossiniLogo from '../assets/brands/rossini.png';
import sanmartinLogo from '../assets/brands/sanmartin.png';
import seagullLogo from '../assets/brands/seagull.png';
import shanghaiLogo from '../assets/brands/shanghai.png';
import sugessLogo from '../assets/brands/sugess.png';
import tandorioLogo from '../assets/brands/tandorio.png';
import tianwangLogo from '../assets/brands/tianwang.svg';
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
  { name: 'Sea-Gull', logo: seagullLogo, type: 'Tianjin watchmaking' },
  { name: 'Shanghai Watch', logo: shanghaiLogo, type: 'Classic mechanical' },
  { name: 'Beijing Watch', logo: beijingLogo, type: 'Heritage atelier' },
  { name: 'Fiyta', logo: fiytaLogo, type: 'Aerospace inspired' },
  { name: 'Rossini', logo: rossiniLogo, type: 'Dress watches', imageMode: 'dark' },
  { name: 'Ebohr', logo: ebohrLogo, type: 'Modern automatics', imageMode: 'cover' },
  { name: 'Tian Wang', logo: tianwangLogo, type: 'Mainstream collection' },
  { name: 'Peacock', logo: peacockLogo, type: 'Movement maker' },
  { name: 'CIGA Design', logo: cigaLogo, type: 'Design watches' },
  { name: 'Memorigin', logo: memoriginLogo, type: 'Tourbillon craft' },
  { name: 'San Martin', logo: sanmartinLogo, type: 'Diver specialists' },
  { name: 'Sugess', logo: sugessLogo, type: 'Mechanical chronos' },
  { name: 'Pagani Design', logo: paganiLogo, type: 'Sport watches' },
  { name: 'Cadisen', logo: cadisenLogo, type: 'Value automatics' },
  { name: 'Berny', logo: bernyLogo, type: 'Tool watches' },
  { name: 'Addiesdive', logo: addiesdiveLogo, type: 'Dive watches', imageMode: 'cover' },
  { name: 'Heimdallr', logo: heimdallrLogo, type: 'Sapphire divers', imageMode: 'cover' },
  { name: 'Proxima', logo: proximaLogo, type: 'Enthusiast divers', imageMode: 'cover' },
  { name: 'Cronos', logo: cronosLogo, type: 'Premium homage' },
  { name: 'Baltany', logo: baltanyLogo, type: 'Vintage field' },
  { name: 'Merkur', logo: merkurLogo, type: 'Retro mechanical', imageMode: 'dark' },
  { name: 'Tandorio', logo: tandorioLogo, type: 'Custom builds' },
  { name: 'Guanqin', logo: guanqinLogo, type: 'Dress automatics' },
  { name: 'Lobinni', logo: lobinniLogo, type: 'Elegant mechanical' }
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
        <div className="hero-content-custom">
          <span className="hero-badge-pill">LIMITED TO 50 PIECES</span>
          <span className="hero-sku">CH-9343.2-CUBK</span>
          <h1 className="hero-title-custom">
            <span>SPACE</span>
            <span>TIMER</span>
            <span>JUPITER</span>
          </h1>
          <h2 className="hero-slogan-custom">The Time Is Yours</h2>
          
          <div className="hero-subtext-container">
            <span className="find-out-more-badge">FIND OUT MORE</span>
            <p className="hero-subtext-custom">
              Shop our exquisite collection of luxury watches and elevate your style today
            </p>
          </div>
          
          <Link to="/products" className="hero-shop-btn">
            SHOP
          </Link>
        </div>

        <div className="hero-visual-custom">
          <span className="hero-available-label">AVAILABLE</span>
          
          <div className="hero-watch-container">
            <img src="/jupiter_watch.png" alt="Space Timer Jupiter luxury skeleton mechanical watch" className="hero-watch-image" />
          </div>

          <div className="hero-video-widget">
            <img src="/watch_video_thumbnail.png" alt="Watch video preview" />
            <button className="play-button-custom" aria-label="Play video">
              <span className="play-icon-circle"></span>
            </button>
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
                <span className={`brand-image-shell${brand.imageMode ? ` ${brand.imageMode}` : ''}`}>
                  <img src={brand.logo} alt={`${brand.name} brand logo`} loading="lazy" />
                </span>
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
