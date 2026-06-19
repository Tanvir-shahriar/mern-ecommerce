import { ArrowRight, Cpu, CreditCard, ShieldCheck, Timer, Truck, WalletCards, Play, Pause } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard.jsx';
import { SpiderClock } from '../components/SpiderClock.jsx';
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

const patekSlides = [
  {
    title: 'Sea-Gull Mechanical Excellence',
    description: 'Discover the legendary 1963 Chronograph and heritage mechanical movements. Tianjin watchmaking craft meets timeless design.',
    ctaUrl: '/products?brand=Sea-Gull',
    ctaText: 'Explore Collection',
    desktopVideo: '/videos/seagull_desktop.webm',
    mobileVideo: '/videos/seagull_desktop.webm'
  },
  {
    title: 'San Martin Diver Specialists',
    description: 'Engineered for the deep. Featuring robust sapphire crystals, NH35 automatic movements, and premium luminous dials.',
    ctaUrl: '/products?brand=San%20Martin',
    ctaText: 'Explore Divers',
    desktopVideo: '/videos/sanmartin_desktop.webm',
    mobileVideo: '/videos/sanmartin_desktop.webm'
  },
  {
    title: 'Sugess Mechanical Chronographs',
    description: 'Featuring genuine Seagull ST19 column wheel movements, sapphire exhibition casebacks, and classic vintage styling.',
    ctaUrl: '/products?brand=Sugess',
    ctaText: 'Explore Chronos',
    desktopVideo: '/videos/sugess_desktop.webm',
    mobileVideo: '/videos/sugess_desktop.webm'
  }
];

export const HomePage = () => {
  const [heroIndex, setHeroIndex] = useState(0);
  const [purchaseId, setPurchaseId] = useState('');
  const [activePatekSlide, setActivePatekSlide] = useState(0);
  const [isPatekPlaying, setIsPatekPlaying] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const carouselRef = useRef(null);
  const activeSlideRef = useRef(0);
  activeSlideRef.current = activePatekSlide;

  useEffect(() => {
    if (!isPatekPlaying) return;
    const interval = setInterval(() => {
      setActivePatekSlide((prev) => (prev + 1) % patekSlides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [activePatekSlide, isPatekPlaying]);

  useEffect(() => {
    const carouselEl = carouselRef.current;
    if (!carouselEl) return;

    let lastScrollTime = 0;
    let lastSnapTime = 0;
    const cooldown = 800;
    const snapCooldown = 1000;

    const handleWheel = (e) => {
      const rect = carouselEl.getBoundingClientRect();
      const headerHeight = document.querySelector('.site-header')?.offsetHeight || 65;
      const currentSlide = activeSlideRef.current;

      console.log("CAROUSEL WHEEL:", {
        rectTop: rect.top,
        headerHeight,
        diff: Math.abs(rect.top - headerHeight),
        currentSlide
      });

      // If the top of the carousel is not aligned below the sticky header, smooth snap scroll to it
      if (Math.abs(rect.top - headerHeight) > 8) {
        e.preventDefault();
        const now = Date.now();
        console.log("CAROUSEL SNAP TRIGGERED. scrollY:", window.scrollY, "target:", rect.top + window.scrollY - headerHeight);
        if (now - lastSnapTime > snapCooldown) {
          window.scrollTo({
            top: rect.top + window.scrollY - headerHeight,
            behavior: 'smooth'
          });
          lastSnapTime = now;
        }
        return;
      }

      const now = Date.now();
      if (now - lastScrollTime < cooldown) {
        e.preventDefault();
        return;
      }

      const deltaY = e.deltaY;
      if (Math.abs(deltaY) < 15) return;

      if (deltaY > 0) {
        if (currentSlide < patekSlides.length - 1) {
          e.preventDefault();
          setActivePatekSlide(currentSlide + 1);
          lastScrollTime = now;
        }
      } else {
        if (currentSlide > 0) {
          e.preventDefault();
          setActivePatekSlide(currentSlide - 1);
          lastScrollTime = now;
        }
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!touchStartY) return;
      
      const rect = carouselEl.getBoundingClientRect();
      const headerHeight = document.querySelector('.site-header')?.offsetHeight || 65;

      if (Math.abs(rect.top - headerHeight) > 8) {
        e.preventDefault();
        const now = Date.now();
        if (now - lastSnapTime > snapCooldown) {
          window.scrollTo({
            top: rect.top + window.scrollY - headerHeight,
            behavior: 'smooth'
          });
          lastSnapTime = now;
        }
        return;
      }

      const touchEndY = e.touches[0].clientY;
      const diffY = touchStartY - touchEndY;
      if (Math.abs(diffY) > 50) {
        const now = Date.now();
        if (now - lastScrollTime < cooldown) {
          e.preventDefault();
          return;
        }
        
        const currentSlide = activeSlideRef.current;

        if (diffY > 0) {
          if (currentSlide < patekSlides.length - 1) {
            e.preventDefault();
            setActivePatekSlide(currentSlide + 1);
            lastScrollTime = now;
          }
        } else {
          if (currentSlide > 0) {
            e.preventDefault();
            setActivePatekSlide(currentSlide - 1);
            lastScrollTime = now;
          }
        }
        touchStartY = 0;
      }
    };

    carouselEl.addEventListener('wheel', handleWheel, { passive: false });
    carouselEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    carouselEl.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      carouselEl.removeEventListener('wheel', handleWheel);
      carouselEl.removeEventListener('touchstart', handleTouchStart);
      carouselEl.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

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

      <section ref={carouselRef} className="hero-carousel_hero-carousel__bEV8J patek-hero-carousel">
        <div className="patek-carousel-track" style={{ transform: `translateY(-${activePatekSlide * 100}%)` }}>
          {patekSlides.map((slide, idx) => {
            const isActive = idx === activePatekSlide;
            return (
              <article
                key={idx}
                className={`hero-carousel-item_hero-carousel-item__d5OPU patek-carousel-item ${
                  isActive ? 'hero-carousel-item_--is-active active' : ''
                }`}
              >
                {/* Media Wrapper */}
                <div className="hero-carousel-item_media-wrapper__u6xit patek-carousel-media-wrapper">
                  {/* Desktop Video */}
                  <video
                    className="patek-video desktop-only"
                    src={slide.desktopVideo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    referrerPolicy="no-referrer"
                  />
                  {/* Mobile Video */}
                  <video
                    className="patek-video mobile-only"
                    src={slide.mobileVideo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Background overlay */}
                <div className="hero-carousel-item_background__t4Xol hero-carousel-item_--overlay-20__e2JiN patek-carousel-overlay" />

                {/* Content Container */}
                <div className="hero-carousel-item_container__iKRW4 hero-carousel-item_--is-left__tnUic patek-carousel-content-container">
                  <h2 className="hero-carousel-item_title__Rw_ym notranslate patek-carousel-title">
                    {slide.title}
                  </h2>
                  <div className="hero-carousel-item_description__d6lT4 patek-carousel-description">
                    <p>{slide.description}</p>
                  </div>
                  <div className="hero-carousel-item_cta-container__qsuy2 patek-carousel-cta-container">
                    <Link
                      to={slide.ctaUrl}
                      className="cta_--is-white__0hlgs patek-carousel-cta"
                    >
                      {slide.ctaText}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Carousel Pagination & Play/Pause controls */}
        <div className="patek-carousel-controls">
          <button
            type="button"
            className="patek-play-pause-btn"
            onClick={() => setIsPatekPlaying((prev) => !prev)}
            aria-label={isPatekPlaying ? 'Pause slide rotation' : 'Play slide rotation'}
          >
            {isPatekPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          </button>

          <div className="patek-carousel-pagination">
            {patekSlides.map((_, idx) => {
              const isActive = idx === activePatekSlide;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`patek-pagination-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActivePatekSlide(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  <span className="patek-pagination-number">0{idx + 1}</span>
                  <div className="patek-pagination-line-bg">
                    <span
                      key={`${idx}-${isPatekPlaying}-${activePatekSlide}`}
                      className={`patek-pagination-line-fill ${isActive ? 'animate' : ''} ${
                        !isPatekPlaying ? 'paused' : ''
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <SpiderClock />

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
