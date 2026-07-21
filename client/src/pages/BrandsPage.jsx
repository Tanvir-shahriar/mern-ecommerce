import { ArrowRight, ChevronLeft, ChevronRight, Heart, ShoppingBag, X, Sun, Moon, Search, Menu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Seo } from '../components/Seo.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { api, mediaUrl } from '../services/api.js';

const IconFacebook = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.65 13.75 5.65c1.08 0 2.21.19 2.21.19v2.43h-1.25c-1.23 0-1.61.77-1.61 1.56V12h2.74l-.44 3h-2.3v6.8c4.56-.93 8-4.96 8-9.8z"/>
  </svg>
);

const IconInstagram = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const IconTwitter = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// SVG Rotating Stamp Badge Component with Red Quarter-Circle Wedge Accent (Exact Video 00:01 - 00:07)
const StampBadge = ({ text, logo = "Y's" }) => {
  const pathId = `stamp-circle-path-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div className="collection-stamp-wrapper">
      {/* Red Quarter-Circle Sector Accent behind the badge */}
      <div className="collection-stamp-red-wedge" />
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
    </div>
  );
};

// Fallback high quality products curated for website policy & e-commerce categories
const fallbackCollections = [
  {
    categoryKey: 'fashion',
    title: 'SPRING / SUMMER COLLECTION',
    kicker: 'YOHJI YAMAMOTO SPECIAL SELECTION',
    stampText: 'YOHJI YAMAMOTO SHOP • FOR THE SAKE OF FREEDOM AND HUMAN DIGNITY',
    tagline: 'High-end architectural draping, avant-garde graphics, and practical daily luxury.',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
      alt: 'Spring Summer Collection'
    },
    products: [
      {
        _id: 'fash-1',
        name: 'Jubilant Buddha Graphic Cut & Sewn',
        brand: 'Yohji Yamamoto',
        sku: 'GZ-T21-076-2-03',
        price: 45000,
        mensModel: '185 cm',
        ladysModel: '168 cm',
        material: '100% Premium Cotton',
        description: 'Collaboration series with contemporary artist "Yasuto Sasada". Featuring original artwork drawn with fine 0.3mm technical pen details, expressing cosmic energy and modern graphic strength.',
        images: [
          { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', alt: 'Jubilant Buddha Front' },
          { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', alt: 'Jubilant Buddha Full Outfit' },
          { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', alt: 'Jubilant Buddha Detail' },
          { url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80', alt: 'Jubilant Buddha Back' }
        ]
      },
      {
        _id: 'fash-2',
        name: 'Avant-Garde Pleated Layered Skirt Coat',
        brand: 'Yohji Yamamoto',
        sku: 'GZ-P12-104-1-01',
        price: 38000,
        mensModel: '182 cm',
        ladysModel: '165 cm',
        material: 'Tropical Wool Drape',
        description: 'Tailored from tropical wool drape with double forward pleats, wide relaxed silhouette, subtle coin pocket, and concealed horn buttons.',
        images: [
          { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', alt: 'Pleated Trousers' },
          { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', alt: 'Pleated Angle' }
        ]
      },
      {
        _id: 'fash-3',
        name: 'Deconstructed Drape Oversized Trench',
        brand: 'Yohji Yamamoto',
        sku: 'GZ-C05-890-3-02',
        price: 58000,
        mensModel: '188 cm',
        ladysModel: '170 cm',
        material: '100% Japanese Cotton Twill',
        description: 'An iconic deconstructed trench coat engineered with asymmetric storm flaps, deep welt pockets, and custom belt buckle detailing.',
        images: [
          { url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80', alt: 'Trench Coat Front' },
          { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', alt: 'Trench Coat Side' }
        ]
      },
      {
        _id: 'fash-4',
        name: 'Architectural Asymmetric Kimono Robe',
        brand: 'Yohji Yamamoto',
        sku: 'GZ-K09-440-2-04',
        price: 49000,
        mensModel: '185 cm',
        ladysModel: '168 cm',
        material: 'Silk Blend Twill',
        description: 'Fluid silhouette kimono robe with relaxed shoulders, extended cuffs, and signature calligraphy embroidery.',
        images: [
          { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', alt: 'Kimono Robe' }
        ]
      }
    ]
  },
  {
    categoryKey: 'electronics',
    title: 'NEXT-GEN TECH & WEARABLES',
    kicker: 'HIGH-END DIGITAL ESSENTIALS',
    stampText: 'LAHVENTURE TECH • INNOVATION & ELEGANCE • 2026',
    tagline: 'State-of-the-art Audio, Smartwatches & Cutting Edge Devices designed for seamless daily performance.',
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
        mensModel: 'Studio Pro',
        ladysModel: 'Active ANC',
        material: 'Beryllium & Anodized Aluminum',
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
        mensModel: '44mm Titanium Case',
        ladysModel: '40mm Titanium Case',
        material: 'Grade 5 Titanium & Sapphire Glass',
        description: 'A polished everyday smartwatch with GPS workouts, Bluetooth calling, health metrics, sleep reports, and a bright always-on AMOLED display.',
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
        mensModel: 'Spatial Sound System',
        ladysModel: 'Compact Edition',
        material: 'Acoustic Mesh & Brushed Steel',
        description: 'An acoustic masterpiece with dual passive radiators, room calibration, IP67 dust/waterproofing, and magnetic charging dock.',
        images: [
          { url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80', alt: 'Spatial Speaker' }
        ]
      }
    ]
  },
  {
    categoryKey: 'watches',
    title: 'LUXURY TIMEPIECE COLLECTION',
    kicker: 'PRECISION HOROLOGY & CRAFTSMANSHIP',
    stampText: 'LAHVENTURE HOROLOGY • SWISS & MODERN MECHANICS • 2026',
    tagline: 'Exquisite automatic watches, tourbillons, and chronographs built with uncompromising heritage.',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
      alt: 'Luxury Watches'
    },
    products: [
      {
        _id: 'watch-1',
        name: 'Chrono-Skeleton Automatic Tourbillon',
        brand: 'Patek & Co',
        sku: 'PT-SKELETON-01',
        price: 185000,
        mensModel: '41mm Case',
        ladysModel: 'Automatic Movement',
        material: '18k Rose Gold & Alligator Leather',
        description: 'A horological masterpiece featuring skeletonized bridges, sapphire crystal caseback, 72-hour power reserve, and hand-finished guilloché dial.',
        images: [
          { url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80', alt: 'Tourbillon Watch' }
        ]
      },
      {
        _id: 'watch-2',
        name: 'Nautilus Ocean Diver Chronograph',
        brand: 'Venture Marine',
        sku: 'VM-DIVER-300M',
        price: 94000,
        mensModel: '300m Waterproof',
        ladysModel: 'LumiBrite Dial',
        material: '904L Stainless Steel',
        description: 'Professional diving chronograph with ceramic unidirectional rotating bezel, helium escape valve, and high-beat automatic movement.',
        images: [
          { url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80', alt: 'Ocean Diver Watch' }
        ]
      }
    ]
  }
];

export const BrandsPage = () => {
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();
  const { addItem } = useCart();

  // Light Theme Default (Matching Reference Video) & Theme Switcher
  const [theme, setTheme] = useState('light'); // 'light' | 'dark'

  // Modal State for Split Screen Detail View (Video 00:08 - 00:16)
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
      navigate(`/products/${product.slug || product._id || product.id}`);
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Curated Seasonal Collections | LahVenture',
    description: 'Explore light editorial high-fashion, technology, home living, and luxury timepieces at LahVenture.'
  };

  return (
    <main className={`collections-page ${theme === 'light' ? 'collections-light-theme' : 'collections-dark-theme'}`}>
      <Seo
        title="Collections | LahVenture"
        description="Discover exclusive seasonal collections inspired by high-fashion editorial styling and modern luxury."
        schemaJson={schema}
      />



      {/* MAIN LAYOUT WITH LEFT VERTICAL SIDEBAR & HERO SHOWCASE */}
      <div className="collections-main-container">
        
        {/* LEFT VERTICAL SIDEBAR WITH SOCIALS & ROTATING STAMP (EXACT VIDEO 00:01 - 00:07) */}
        <aside className="collections-left-sidebar">
          <div className="sidebar-social-links">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              <IconFacebook />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <IconInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
              <IconTwitter />
            </a>
          </div>

          <div className="sidebar-vertical-text">Follow us</div>
        </aside>

        {/* HERO SHOWCASE SECTIONS */}
        <div className="collections-content-wrapper">
          <div className="collections-page-header">
            <p className="eyebrow">SPRING / SUMMER COLLECTION</p>
            <h1>CREATIVE WAYS TO STYLE YOUR LUXURY ESSENTIALS</h1>
            <p>
              High-end aesthetic designs crafted to feel inspiring, useful, and practically luxurious.
            </p>
          </div>

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
        </div>

      </div>

      {/* SPLIT PRODUCT DETAIL OVERLAY MODAL / EXPANDED PAGE VIEW (VIDEO 00:08 - 00:16 ACCURATE) */}
      {selectedProduct ? (
        <div className="collection-modal-backdrop" onClick={closeModal}>
          <div className="collection-modal-container" onClick={(e) => e.stopPropagation()}>
            
            {/* Top Bar with Close X and Visit Link */}
            <div className="modal-top-bar-overlay">
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeModal}
                aria-label="Close detail modal"
              >
                <X size={22} />
              </button>

              <div className="modal-top-bar-actions">
                <Link
                  to={`/products?category=${encodeURIComponent(selectedProduct.category?.name || '')}`}
                  className="modal-visit-link"
                  onClick={closeModal}
                >
                  Visit the Collection &gt;
                </Link>
                <button type="button" className="modal-top-icon-btn" onClick={() => navigate('/products')}>
                  <Search size={18} />
                </button>
                <button type="button" className="modal-top-icon-btn" onClick={() => navigate('/cart')}>
                  <ShoppingBag size={18} />
                </button>
              </div>
            </div>

            {/* Main Split Grid */}
            <div className="modal-split-grid">
              
              {/* Left Column: Full Product Model Image & Vertical Specifications Overlay */}
              <div className="modal-left-column">
                <img
                  src={mediaUrl(selectedProduct.images?.[activeImageIndex]?.url || selectedProduct.images?.[0]?.url)}
                  alt={selectedProduct.name}
                  className="modal-left-product-image"
                />

                {/* Frame-by-Frame Video Spec Box Overlay on photo */}
                <div className="modal-vertical-specs">
                  <span className="spec-title">"{selectedProduct.name}"</span>
                  <span className="spec-sku">{selectedProduct.sku || 'GZ-T21-076-2-03'}</span>
                  <div className="spec-details-list">
                    {selectedProduct.mensModel ? <div>Men's Model: {selectedProduct.mensModel}</div> : <div>Men's Model: 185 cm</div>}
                    {selectedProduct.ladysModel ? <div>Lady's Model: {selectedProduct.ladysModel}</div> : <div>Lady's Model: 168 cm</div>}
                    {selectedProduct.material ? <div>{selectedProduct.material}</div> : <div>100% Cotton</div>}
                  </div>
                </div>
              </div>

              {/* Right Column: Information, Actions & Thumbnails (Clean Light Background) */}
              <div className="modal-right-column">
                
                <div className="modal-body-content">
                  <p className="modal-collab-subtitle">
                    {selectedProduct.brand
                      ? `${selectedProduct.brand.toUpperCase()} COLLABORATION GRAPHIC CUT AND SEWN`
                      : 'YASUTO SASADA COLLABORATION GRAPHIC CUT AND SEWN'}
                  </p>

                  <h2 className="modal-product-title">"{selectedProduct.name.toUpperCase()}"</h2>
                  <p className="modal-sku-tag">{selectedProduct.sku || 'GZ-T21-076-2-03'}</p>

                  <p className="modal-product-desc">
                    {selectedProduct.description ||
                      'Collaboration series with contemporary artist. Featuring original artwork drawn with technical power and complex cosmic energy.'}
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
                      {addingToCart ? 'ADDING...' : 'SHOP NOW'} &gt;
                    </button>

                    <button
                      type="button"
                      className="modal-wishlist-btn"
                      onClick={() => setWishlistSaved(!wishlistSaved)}
                    >
                      <Heart size={16} fill={wishlistSaved ? 'currentColor' : 'none'} />
                      {wishlistSaved ? 'In Wish List' : '+ Add to Wish List'}
                    </button>
                  </div>
                </div>

                {/* Horizontal Alternate Thumbnail Image Switcher (Video 00:11-00:15) */}
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
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
        </div>
      ) : null}
    </main>
  );
};

// Sub-Component: Individual Category Hero Section (Matching Video Layout)
const HeroSection = ({ collection, onOpenProduct, formatMoney }) => {
  const trackRef = useRef(null);

  const scrollTrack = (direction) => {
    if (!trackRef.current) return;
    const distance = 260;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
  };

  const products = collection.products || [];

  return (
    <section className="collection-hero-section">
      {/* Left Editorial Showcase Image */}
      <div className="collection-hero-showcase">
        <div className="collection-hero-image-wrap">
          <img
            src={mediaUrl(collection.bannerImage?.url)}
            alt={collection.bannerImage?.alt || collection.title}
            className="collection-hero-image"
          />
          <div className="collection-hero-overlay-gradient" />
        </div>

        {/* Circular Rotating Stamp Badge with Red Wedge Accent */}
        <StampBadge
          text={collection.stampText || 'YOHJI YAMAMOTO SHOP • FOR THE SAKE OF FREEDOM AND HUMAN DIGNITY'}
          logo={collection.categoryKey === 'fashion' ? "Y's" : collection.title?.substring(0, 2) || 'LV'}
        />

        <div className="collection-hero-side-slogan">
          {collection.kicker || 'SPRING / SUMMER COLLECTION'}
        </div>
      </div>

      {/* Right Content & Product Carousel */}
      <div className="collection-hero-content">
        <div className="collection-hero-header-meta">
          <h2 className="collection-hero-title">{collection.title}</h2>
          {collection.tagline ? <p className="collection-tagline">{collection.tagline}</p> : null}
        </div>

        {/* Product Carousel with Tall Vertical Cards (Exact Video 00:01 - 00:07) */}
        <div className="collection-product-carousel-wrapper">
          <div className="collection-carousel-controls">
            <span className="collection-carousel-heading">SPRING / SUMMER COLLECTION</span>
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
                  <span className="collection-card-brand">{product.brand || 'Yohji Yamamoto'}</span>
                  <h3 className="collection-card-name">{product.name}</h3>
                  <span className="collection-card-price">{formatMoney(product.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Footer Link */}
        <div className="collection-hero-footer">
          <button
            type="button"
            className="collection-explore-btn"
            onClick={() => products.length > 0 && onOpenProduct(products[0])}
          >
            Visit the Collection &gt;
          </button>
        </div>
      </div>
    </section>
  );
};
