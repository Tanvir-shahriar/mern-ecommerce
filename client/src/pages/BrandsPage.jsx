import { ArrowRight, ChevronLeft, ChevronRight, Heart, ShoppingBag, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Seo } from '../components/Seo.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { api, mediaUrl } from '../services/api.js';

// SVG Rotating Stamp Badge Component
const StampBadge = ({ text, logo = "Y's" }) => {
  const pathId = `stamp-circle-path-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div className="collection-stamp-badge">
      <svg className="collection-stamp-svg" viewBox="0 0 160 160">
        <path
          id={pathId}
          d="M 80, 80 m -62, 0 a 62,62 0 1,1 124,0 a 62,62 0 1,1 -124,0"
          fill="none"
        />
        <text className="collection-stamp-text">
          <textPath href={`#${pathId}`} startOffset="0%">
            {text} • {text} •
          </textPath>
        </text>
      </svg>
      <span className="collection-stamp-center-logo">{logo}</span>
    </div>
  );
};

// Fallback high quality products if none fetched
const fallbackCollections = [
  {
    categoryKey: 'fashion',
    title: 'FASHION COLLECTION',
    kicker: 'SPRING / SUMMER 2026',
    stampText: 'FASHION • EXCLUSIVE COLLECTION • 2026',
    tagline: 'Curated Haute Couture, Modern Apparel & Luxury Styling',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
      alt: 'Fashion Collection'
    },
    products: [
      {
        _id: 'fash-1',
        name: 'Y-26 Architectural Graphic Kimono Coat',
        brand: 'Yohji Yamamoto',
        sku: 'GZ-T21-070-2-03',
        price: 45000,
        description: 'Crafted from heavyweight Japanese cotton twill, this architectural graphic coat features signature relaxed proportions, drop shoulders, and custom screen-printed artwork across the back.',
        images: [
          { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', alt: 'Kimono Coat' },
          { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', alt: 'Coat Detail' }
        ]
      },
      {
        _id: 'fash-2',
        name: 'Jubilant Minimalist Pleated Trousers',
        brand: 'Yohji Yamamoto',
        sku: 'GZ-P12-104-1-01',
        price: 32000,
        description: 'Tailored from tropical wool drape with double forward pleats, wide relaxed silhouette, subtle coin pocket, and concealed horn buttons.',
        images: [
          { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', alt: 'Trousers' }
        ]
      },
      {
        _id: 'fash-3',
        name: 'Avant-Garde Drape Trench Overcoat',
        brand: 'Yohji Yamamoto',
        sku: 'GZ-C05-890-3-02',
        price: 58000,
        description: 'An iconic deconstructed trench coat engineered with asymmetric storm flaps, deep welt pockets, and custom belt buckle detailing.',
        images: [
          { url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80', alt: 'Trench Coat' }
        ]
      }
    ]
  },
  {
    categoryKey: 'electronics',
    title: 'ELECTRONICS COLLECTION',
    kicker: 'NEXT-GEN TECH & WEARABLES',
    stampText: 'ELECTRONICS • INNOVATION & TECH • 2026',
    tagline: 'State-of-the-art Audio, Smartwatches & Cutting Edge Devices',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
      alt: 'Electronics Collection'
    },
    products: [
      {
        _id: 'elec-1',
        name: 'Acoustique Studio Noise-Cancelling Headphones',
        brand: 'Acoustique',
        sku: 'AC-AUDIO-PRO-99',
        price: 38500,
        description: 'Engineered with custom 45mm beryllium drivers, active noise cancellation, low-latency Bluetooth 5.3, and 40-hour battery stamina.',
        images: [
          { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80', alt: 'Studio Headphones' }
        ]
      },
      {
        _id: 'elec-2',
        name: 'lahVenture Apex S9 Smartwatch',
        brand: 'lahVenture',
        sku: 'LV-SMART-APEX-S9',
        price: 22900,
        description: 'A polished everyday smartwatch with GPS workouts, Bluetooth calling, health metrics, sleep reports, and a bright always-on display.',
        images: [
          { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80', alt: 'Apex Smartwatch' }
        ]
      },
      {
        _id: 'elec-3',
        name: 'Vortex Portable Spatial Speaker',
        brand: 'Vortex Audio',
        sku: 'VX-SPK-360',
        price: 26000,
        description: 'An acoustic masterpiece with dual passive radiators, room calibration, IP67 dust/waterproofing, and magnetic charging dock.',
        images: [
          { url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80', alt: 'Spatial Speaker' }
        ]
      }
    ]
  },
  {
    categoryKey: 'home-living',
    title: 'HOME & LIVING COLLECTION',
    kicker: 'MODERN INTERIORS & DECOR',
    stampText: 'HOME & LIVING • ELEGANT DESIGN • 2026',
    tagline: 'Refined Home Aesthetics, Minimalist Furniture & Living Gear',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      alt: 'Home Living Collection'
    },
    products: [
      {
        _id: 'home-1',
        name: 'Aero Lounge Sculptural Accent Chair',
        brand: 'Kjaer Living',
        sku: 'KJ-CHAIR-AERO',
        price: 64000,
        description: 'Designed for contemporary living spaces, featuring density foam cushioning, organic contours, and hand-welded architectural steel legs.',
        images: [
          { url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80', alt: 'Accent Chair' }
        ]
      },
      {
        _id: 'home-2',
        name: 'Lumina Warm Diffused Pendant Light',
        brand: 'Lumina Haus',
        sku: 'LM-LIGHT-PDNT',
        price: 28900,
        description: 'Creates ambient warm illumination with dimmable LED core, satin brass suspension rod, and hand-finished glass diffuser.',
        images: [
          { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80', alt: 'Pendant Light' }
        ]
      },
      {
        _id: 'home-3',
        name: 'Zenith Handcrafted Ceramic Vase Set',
        brand: 'Zenith Studio',
        sku: 'ZN-VASE-TRIO',
        price: 14500,
        description: 'Each vessel is thrown by hand with raw stoneware clay, matte reactive glaze, and unique organic form variations.',
        images: [
          { url: 'https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?auto=format&fit=crop&w=1200&q=80', alt: 'Vase Set' }
        ]
      }
    ]
  },
  {
    categoryKey: 'beauty-care',
    title: 'BEAUTY & PERSONAL CARE',
    kicker: 'ESSENTIAL CARE & LUXURY BEAUTY',
    stampText: 'BEAUTY • LUXURY CARE • 2026',
    tagline: 'Botanical Skincare, Fragrance Masterpieces & Organic Self-Care',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
      alt: 'Beauty Collection'
    },
    products: [
      {
        _id: 'beauty-1',
        name: 'Botanical Elixir Facial Radiance Serum',
        brand: 'Aura Botanicals',
        sku: 'AR-SERUM-RAD',
        price: 12800,
        description: 'Formulated with cold-pressed rosehip seed oil, bakuchiol, and bio-fermented algae to restore skin elasticity and natural radiance.',
        images: [
          { url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80', alt: 'Botanical Serum' }
        ]
      },
      {
        _id: 'beauty-2',
        name: 'Nocturne Eau de Parfum 100ml',
        brand: 'Maison Noir',
        sku: 'MN-PERF-NOCT',
        price: 24500,
        description: 'An evocative olfactory composition opening with crisp Italian bergamot, deepening into rare agarwood resin and warm golden amber.',
        images: [
          { url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80', alt: 'Nocturne Perfume' }
        ]
      },
      {
        _id: 'beauty-3',
        name: 'Velvet Hydra-Balm Lip Treatment',
        brand: 'Aura Botanicals',
        sku: 'AR-BALM-LIP',
        price: 6500,
        description: 'Delivers intensive hydration, smoothing fine lines and plumping lips with botanical seed oils and restorative peptides.',
        images: [
          { url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=80', alt: 'Lip Balm' }
        ]
      }
    ]
  }
];

export const BrandsPage = () => {
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();
  const { addItem } = useCart();

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistSaved, setWishlistSaved] = useState(false);

  // Fetch Public Collection & FAQ Settings
  const { data: brandPageData } = useQuery({
    queryKey: ['brand-page-public'],
    queryFn: async () => {
      const { data } = await api.get('/brand-page');
      return data.data;
    },
    staleTime: 60 * 1000,
    retry: 1
  });

  const collections = brandPageData?.collections && brandPageData.collections.length > 0
    ? brandPageData.collections
    : fallbackCollections;

  // Open Product Overlay Modal (Exact Video Animation & UI 00:09-00:16)
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setWishlistSaved(false);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const handleShopNow = async (product) => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addItem(product._id || product.id, 1);
      closeModal();
      navigate('/cart');
    } catch (err) {
      console.error('Add to cart failed:', err);
      // Fallback navigate to detail page
      navigate(`/products/${product.slug || product._id || product.id}`);
    } finally {
      setAddingToCart(false);
    }
  };

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Curated Collections | LahVenture',
    description: 'Explore curated collections for Fashion, Electronics, Home & Living, and Beauty at LahVenture.'
  };

  return (
    <main className="collections-page">
      <Seo
        title="Collections | LahVenture"
        description="Discover exclusive seasonal collections in Fashion, Electronics, Home & Living, and Beauty & Personal Care."
        schemaJson={schema}
      />

      <header className="collections-page-header">
        <p className="eyebrow">Curated Collections</p>
        <h1>Aesthetic Essentials & Living</h1>
        <p>
          Explore four distinct category hero showcases. Select any piece to view fine details, specifications, and instant purchasing.
        </p>
      </header>

      <div className="collections-hero-list">
        {collections.map((collection, index) => (
          <HeroSection
            key={collection.categoryKey || index}
            collection={collection}
            onOpenProduct={openProductModal}
            formatMoney={formatMoney}
          />
        ))}
      </div>

      {/* SPLIT PRODUCT DETAIL OVERLAY MODAL (VIDEO 00:09 - 00:16 ACCURATE) */}
      {selectedProduct ? (
        <div className="collection-modal-backdrop" onClick={closeModal}>
          <div className="collection-modal-container" onClick={(e) => e.stopPropagation()}>
            
            {/* Left Column: Full Product Showcase & Vertical Specs */}
            <div className="modal-left-column">
              <img
                src={mediaUrl(selectedProduct.images?.[activeImageIndex]?.url || selectedProduct.images?.[0]?.url)}
                alt={selectedProduct.name}
                className="modal-left-product-image"
              />
              <div className="modal-vertical-specs">
                <span>SKU: {selectedProduct.sku || 'LV-COLLECT-01'}</span>
                <strong>{selectedProduct.brand || 'LahVenture'}</strong>
                <span>{selectedProduct.category?.name || 'Curated Item'}</span>
              </div>
            </div>

            {/* Right Column: Information, Actions & Thumbnails */}
            <div className="modal-right-column">
              <div className="modal-top-bar">
                <Link
                  to={`/products?category=${encodeURIComponent(selectedProduct.category?.name || '')}`}
                  className="modal-visit-link"
                  onClick={closeModal}
                >
                  Visit the Collection &gt;
                </Link>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={closeModal}
                  aria-label="Close detail modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <p className="modal-collab-subtitle">
                  {selectedProduct.brand ? `${selectedProduct.brand} SPECIAL SELECTION` : 'EXCLUSIVE RELEASE'}
                </p>
                <h2 className="modal-product-title">{selectedProduct.name}</h2>
                <p className="modal-sku-tag">ITEM CODE: {selectedProduct.sku || 'GZ-T21-070-2-03'}</p>
                <p className="modal-product-desc">
                  {selectedProduct.description || selectedProduct.shortDescription || 'Crafted with premium materials and signature design language.'}
                </p>

                <div className="modal-price-tag">
                  {formatMoney(selectedProduct.price)}
                </div>

                <div className="modal-action-row">
                  <button
                    type="button"
                    className="modal-shop-now-btn"
                    onClick={() => handleShopNow(selectedProduct)}
                    disabled={addingToCart}
                  >
                    <ShoppingBag size={18} />
                    {addingToCart ? 'Adding...' : 'SHOP NOW'}
                  </button>

                  <button
                    type="button"
                    className="modal-wishlist-btn"
                    onClick={() => setWishlistSaved(!wishlistSaved)}
                  >
                    <Heart size={16} fill={wishlistSaved ? 'currentColor' : 'none'} />
                    {wishlistSaved ? 'In Wishlist' : 'Add to Wish List'}
                  </button>
                </div>
              </div>

              {/* Alternate Thumbnail Image Switcher */}
              {selectedProduct.images && selectedProduct.images.length > 1 ? (
                <div className="modal-thumbnail-row">
                  {selectedProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`modal-thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(idx)}
                    >
                      <img src={mediaUrl(img.url)} alt={img.alt || selectedProduct.name} />
                    </button>
                  ))}
                </div>
              ) : null}

            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

// Sub-Component: Individual Category Hero Section
const HeroSection = ({ collection, onOpenProduct, formatMoney }) => {
  const trackRef = useRef(null);

  const scrollTrack = (direction) => {
    if (!trackRef.current) return;
    const distance = 240;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
  };

  const products = collection.products || [];

  return (
    <section className="collection-hero-section">
      {/* Left Editorial Showcase */}
      <div className="collection-hero-showcase">
        <div className="collection-hero-image-wrap">
          <img
            src={mediaUrl(collection.bannerImage?.url)}
            alt={collection.bannerImage?.alt || collection.title}
            className="collection-hero-image"
          />
          <div className="collection-hero-overlay-gradient" />
        </div>

        {/* Circular Rotating Stamp Badge */}
        <StampBadge
          text={collection.stampText || `${collection.title} • 2026`}
          logo={collection.categoryKey === 'fashion' ? "Y's" : collection.title?.substring(0, 2) || 'LV'}
        />

        <div className="collection-hero-side-slogan">
          {collection.kicker || 'SEASONAL COLLECTION'}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="collection-hero-content">
        <div className="collection-hero-header-meta">
          <p className="collection-kicker">{collection.kicker || 'SEASONAL COLLECTION'}</p>
          <h2 className="collection-hero-title">{collection.title}</h2>
          {collection.tagline ? <p className="collection-tagline">{collection.tagline}</p> : null}
        </div>

        {/* Product Carousel */}
        <div className="collection-product-carousel-wrapper">
          <div className="collection-carousel-controls">
            <span className="collection-carousel-heading">Featured Pieces</span>
            <div className="collection-carousel-arrows">
              <button
                type="button"
                className="collection-arrow-btn"
                onClick={() => scrollTrack('left')}
                aria-label="Previous items"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="collection-arrow-btn"
                onClick={() => scrollTrack('right')}
                aria-label="Next items"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="collection-carousel-track" ref={trackRef}>
            {products.map((product) => (
              <div
                key={product._id || product.id}
                className="collection-product-card"
                onClick={() => onOpenProduct(product)}
              >
                <div className="collection-card-img-wrap">
                  <img
                    src={mediaUrl(product.images?.[0]?.url)}
                    alt={product.images?.[0]?.alt || product.name}
                  />
                </div>
                <div className="collection-card-info">
                  <span className="collection-card-brand">{product.brand || 'LahVenture'}</span>
                  <h3 className="collection-card-name">{product.name}</h3>
                  <span className="collection-card-price">{formatMoney(product.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Footer Action */}
        <div className="collection-hero-footer">
          <Link
            to={`/products?search=${encodeURIComponent(collection.categoryKey)}`}
            className="collection-explore-btn"
          >
            Visit the Collection
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};
