import { ArrowRight, Cpu, CreditCard, ShieldCheck, Timer, Truck, WalletCards, Play, Pause } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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

  const carouselStageRef = useRef(null);
  const carouselRef = useRef(null);
  const patekTrackRef = useRef(null);
  const patekVideoRefs = useRef([]);
  const activeSlideRef = useRef(0);
  const targetProgressRef = useRef(0);
  const renderedProgressRef = useRef(0);
  const pageScrollAnimationRef = useRef(null);
  activeSlideRef.current = activePatekSlide;

  const clampPatekProgress = useCallback(
    (progress) => Math.max(0, Math.min(patekSlides.length - 1, progress)),
    []
  );

  const getPatekMetrics = useCallback(() => {
    const stage = carouselStageRef.current;
    if (!stage) return null;

    const stageTop = stage.getBoundingClientRect().top + window.scrollY;
    const scrollDistance = Math.max(1, stage.offsetHeight - window.innerHeight);
    return { stage, stageTop, scrollDistance };
  }, []);

  const applyPatekProgress = useCallback((progress) => {
    const nextProgress = clampPatekProgress(progress);
    renderedProgressRef.current = nextProgress;

    if (patekTrackRef.current) {
      patekTrackRef.current.style.transform = `translate3d(0, -${nextProgress * 100}%, 0)`;
    }

    const nextActive = Math.round(nextProgress);
    if (nextActive !== activeSlideRef.current) {
      activeSlideRef.current = nextActive;
      setActivePatekSlide(nextActive);
    }
  }, [clampPatekProgress]);

  const smoothPageScrollTo = useCallback((targetTop, duration = 1150) => {
    if (pageScrollAnimationRef.current) {
      window.cancelAnimationFrame(pageScrollAnimationRef.current);
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startTop = window.scrollY;
    const distance = targetTop - startTop;
    if (reduceMotion || Math.abs(distance) < 2) {
      window.scrollTo(0, targetTop);
      return;
    }

    const startTime = window.performance.now();
    const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

    const step = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      window.scrollTo(0, startTop + distance * easeOutCubic(progress));

      if (progress < 1) {
        pageScrollAnimationRef.current = window.requestAnimationFrame(step);
      } else {
        pageScrollAnimationRef.current = null;
      }
    };

    pageScrollAnimationRef.current = window.requestAnimationFrame(step);
  }, []);

  const setPatekSlide = useCallback((nextSlide) => {
    const nextIndex = Math.round(clampPatekProgress(nextSlide));
    const metrics = getPatekMetrics();
    const stageRect = metrics?.stage.getBoundingClientRect();
    const isStageVisible = stageRect && stageRect.bottom > 0 && stageRect.top < window.innerHeight;

    targetProgressRef.current = nextIndex;

    if (metrics && isStageVisible) {
      const targetTop = metrics.stageTop + (metrics.scrollDistance * nextIndex) / (patekSlides.length - 1);
      smoothPageScrollTo(targetTop);
      return;
    }

    applyPatekProgress(nextIndex);
  }, [applyPatekProgress, clampPatekProgress, getPatekMetrics, smoothPageScrollTo]);

  const syncPatekVideos = useCallback(() => {
    const carouselRect = carouselRef.current?.getBoundingClientRect();
    const isCarouselVisible = carouselRect && carouselRect.bottom > 0 && carouselRect.top < window.innerHeight;

    patekVideoRefs.current.forEach((slideVideos, slideIndex) => {
      slideVideos?.forEach((video) => {
        if (!video) return;
        const isVisible = window.getComputedStyle(video).display !== 'none';
        if (isCarouselVisible && slideIndex === activePatekSlide && isPatekPlaying && isVisible) {
          video.play().catch(() => {});
        } else {
          video.pause();
          if (slideIndex !== activePatekSlide) video.currentTime = 0;
        }
      });
    });
  }, [activePatekSlide, isPatekPlaying]);

  useEffect(() => {
    syncPatekVideos();
  }, [syncPatekVideos]);

  useEffect(() => {
    let videoSyncFrame = null;
    const requestVideoSync = () => {
      if (videoSyncFrame) return;
      videoSyncFrame = window.requestAnimationFrame(() => {
        videoSyncFrame = null;
        syncPatekVideos();
      });
    };

    window.addEventListener('scroll', requestVideoSync, { passive: true });
    window.addEventListener('resize', requestVideoSync);
    return () => {
      window.removeEventListener('scroll', requestVideoSync);
      window.removeEventListener('resize', requestVideoSync);
      if (videoSyncFrame) window.cancelAnimationFrame(videoSyncFrame);
    };
  }, [syncPatekVideos]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = null;

    const animateFromScroll = () => {
      const metrics = getPatekMetrics();
      if (metrics) {
        const rawProgress = (window.scrollY - metrics.stageTop) / metrics.scrollDistance;
        targetProgressRef.current = clampPatekProgress(rawProgress * (patekSlides.length - 1));
      }

      const targetProgress = targetProgressRef.current;
      const currentProgress = renderedProgressRef.current;
      const nextProgress = mediaQuery.matches
        ? targetProgress
        : currentProgress + (targetProgress - currentProgress) * 0.18;

      if (Math.abs(targetProgress - nextProgress) < 0.002) {
        applyPatekProgress(targetProgress);
      } else {
        applyPatekProgress(nextProgress);
      }

      animationFrame = window.requestAnimationFrame(animateFromScroll);
    };

    animationFrame = window.requestAnimationFrame(animateFromScroll);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [applyPatekProgress, clampPatekProgress, getPatekMetrics]);

  useEffect(() => {
    if (!isPatekPlaying) return;
    const interval = setInterval(() => {
      setPatekSlide((activeSlideRef.current + 1) % patekSlides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isPatekPlaying, setPatekSlide]);

  useEffect(() => () => {
    if (pageScrollAnimationRef.current) {
      window.cancelAnimationFrame(pageScrollAnimationRef.current);
    }
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

      <section
        ref={carouselStageRef}
        className="patek-carousel-scroll-stage"
        style={{ '--patek-slide-count': patekSlides.length }}
      >
        <div ref={carouselRef} className="hero-carousel_hero-carousel__bEV8J patek-hero-carousel">
          <div
            ref={patekTrackRef}
            className="patek-carousel-track"
            style={{ transform: `translate3d(0, -${renderedProgressRef.current * 100}%, 0)` }}
          >
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
                    autoPlay={isActive && isPatekPlaying}
                    muted
                    loop
                    playsInline
                    preload={isActive ? 'auto' : 'metadata'}
                    referrerPolicy="no-referrer"
                    ref={(node) => {
                      patekVideoRefs.current[idx] = patekVideoRefs.current[idx] || [];
                      patekVideoRefs.current[idx][0] = node;
                    }}
                  />
                  {/* Mobile Video */}
                  <video
                    className="patek-video mobile-only"
                    src={slide.mobileVideo}
                    autoPlay={isActive && isPatekPlaying}
                    muted
                    loop
                    playsInline
                    preload={isActive ? 'auto' : 'metadata'}
                    referrerPolicy="no-referrer"
                    ref={(node) => {
                      patekVideoRefs.current[idx] = patekVideoRefs.current[idx] || [];
                      patekVideoRefs.current[idx][1] = node;
                    }}
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
                      setPatekSlide(idx);
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
