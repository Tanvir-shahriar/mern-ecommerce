import { ArrowRight, Cpu, CreditCard, ShieldCheck, Timer, Truck, Play, Pause } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard.jsx';
import { PanoramicPhotoLibrary } from '../components/PanoramicPhotoLibrary.jsx';
import { SpiderClock } from '../components/SpiderClock.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import rolexLogo from '../assets/brands/rolex.svg';
import patekLogo from '../assets/brands/patek.svg';
import apLogo from '../assets/brands/ap.svg';
import vacheronLogo from '../assets/brands/vacheron.svg';
import omegaLogo from '../assets/brands/omega.svg';
import cartierLogo from '../assets/brands/cartier.svg';
import tudorLogo from '../assets/brands/tudor.svg';
import iwcLogo from '../assets/brands/iwc.svg';
import jlcLogo from '../assets/brands/jlc.svg';
import grandseikoLogo from '../assets/brands/grandseiko.svg';
import seikoLogo from '../assets/brands/seiko.svg';
import breitlingLogo from '../assets/brands/breitling.svg';
import tagheuerLogo from '../assets/brands/tagheuer.svg';
import tissotLogo from '../assets/brands/tissot.svg';
import longinesLogo from '../assets/brands/longines.svg';
import hamiltonLogo from '../assets/brands/hamilton.svg';
import { api, mediaUrl } from '../services/api.js';
import { directCheckoutUrl, startDirectCheckout } from '../utils/directCheckout.js';

const perks = [
  {
    icon: Cpu,
    label: 'Curated watch data',
    meta: 'Movement, model, fit',
    detail: 'Clear specs for mechanical watches, smartwatches, case sizes, straps, and daily-wear use.'
  },
  {
    icon: ShieldCheck,
    label: 'Verified checkout',
    meta: 'Protected purchase',
    detail: 'Account-aware orders, saved delivery details, and admin tracking keep each purchase traceable.'
  },
  {
    icon: Truck,
    label: 'Bangladesh delivery',
    meta: 'Address-led dispatch',
    detail: 'District-ready delivery profiles help orders move cleanly from checkout to customer handoff.'
  },
  {
    icon: CreditCard,
    label: 'Flexible payment',
    meta: 'Fast decision point',
    detail: 'Direct purchase paths and cart checkout support quick single-watch orders or planned baskets.'
  }
];

const topWatchBrands = [
  { name: 'Rolex', logo: rolexLogo, type: 'Swiss Luxury Icon' },
  { name: 'Patek Philippe', logo: patekLogo, type: 'Haute Horlogerie' },
  { name: 'Audemars Piguet', logo: apLogo, type: 'Contemporary Prestige' },
  { name: 'Vacheron Constantin', logo: vacheronLogo, type: 'Traditional Craft' },
  { name: 'Omega', logo: omegaLogo, type: 'Precision & Heritage' },
  { name: 'Cartier', logo: cartierLogo, type: 'Elegant Design' },
  { name: 'Tudor', logo: tudorLogo, type: 'Robust Tool Watches' },
  { name: 'IWC Schaffhausen', logo: iwcLogo, type: 'Swiss Engineering' },
  { name: 'Jaeger-LeCoultre', logo: jlcLogo, type: 'Atelier Masterpieces' },
  { name: 'Grand Seiko', logo: grandseikoLogo, type: 'Artisan Polishing' },
  { name: 'Seiko', logo: seikoLogo, type: 'Pioneering Innovation' },
  { name: 'Breitling', logo: breitlingLogo, type: 'Aviation Chronographs' },
  { name: 'TAG Heuer', logo: tagheuerLogo, type: 'Avant-Garde Racing' },
  { name: 'Tissot', logo: tissotLogo, type: 'Accessible Swiss Heritage' },
  { name: 'Longines', logo: longinesLogo, type: 'Traditional Elegance' },
  { name: 'Hamilton', logo: hamiltonLogo, type: 'American Spirit' }
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

  const cancelPatekPageScroll = useCallback(() => {
    if (pageScrollAnimationRef.current) {
      window.cancelAnimationFrame(pageScrollAnimationRef.current);
      pageScrollAnimationRef.current = null;
    }
  }, []);

  const smoothPageScrollTo = useCallback((targetTop, duration = 1150) => {
    cancelPatekPageScroll();

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
  }, [cancelPatekPageScroll]);

  const setPatekSlide = useCallback((nextSlide) => {
    const nextIndex = Math.round(clampPatekProgress(nextSlide));
    const metrics = getPatekMetrics();
    const stageRect = metrics?.stage.getBoundingClientRect();
    const isStagePinned = stageRect && stageRect.top <= 1 && stageRect.bottom >= window.innerHeight - 1;

    targetProgressRef.current = nextIndex;

    if (metrics && isStagePinned) {
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
    const cancelOnUserInput = () => cancelPatekPageScroll();

    window.addEventListener('wheel', cancelOnUserInput, { passive: true });
    window.addEventListener('touchstart', cancelOnUserInput, { passive: true });
    window.addEventListener('keydown', cancelOnUserInput);
    return () => {
      window.removeEventListener('wheel', cancelOnUserInput);
      window.removeEventListener('touchstart', cancelOnUserInput);
      window.removeEventListener('keydown', cancelOnUserInput);
    };
  }, [cancelPatekPageScroll]);

  useEffect(() => () => {
    cancelPatekPageScroll();
  }, [cancelPatekPageScroll]);

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
              aria-label={isPatekPlaying ? 'Pause carousel video' : 'Play carousel video'}
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

      <section className="lahv-signature-section" aria-labelledby="lahv-signature-title">
        <div className="lahv-signature-inner">
          <div className="lahv-signature-copy">
            <p className="eyebrow signature-eyebrow">LahVenture standard</p>
            <h2 id="lahv-signature-title">A refined watch experience, built for everyday confidence.</h2>
            <p>
              Curated mechanical watches and smartwatches with clear sourcing, reliable delivery,
              and after-purchase support for collectors across Bangladesh.
            </p>
            <div className="lahv-signature-actions">
              <Link to="/products" className="lahv-signature-primary">
                Explore watches
                <ArrowRight size={18} />
              </Link>
              <Link to="/products?category=Smartwatch" className="lahv-signature-secondary">
                Smartwatch edit
              </Link>
            </div>
          </div>

          <div className="lahv-signature-visual" aria-hidden="true">
            <span className="lahv-signature-index">LV-01</span>
            <img src="/jupiter_watch.png" alt="" loading="lazy" />
            <div className="lahv-signature-caption">
              <span>Precision selected</span>
              <strong>Mechanical and connected timepieces</strong>
            </div>
          </div>

          <div className="lahv-signature-points">
            <div className="lahv-signature-point">
              <ShieldCheck size={22} />
              <div>
                <strong>Verified sourcing</strong>
                <span>Brand, model, movement, and seller details reviewed before listing.</span>
              </div>
            </div>
            <div className="lahv-signature-point">
              <Timer size={22} />
              <div>
                <strong>Ready-to-wear setup</strong>
                <span>Product details, care notes, and delivery information stay organized.</span>
              </div>
            </div>
            <div className="lahv-signature-point">
              <Truck size={22} />
              <div>
                <strong>Bangladesh delivery</strong>
                <span>Address-aware checkout and order tracking for a smoother purchase.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SpiderClock />

      <section className="perks-bar" aria-label="LahVenture service promises">
        <div className="perks-bar-header">
          <p className="eyebrow">LahVenture promise</p>
        </div>

        <div className="perks-grid">
          {perks.map(({ icon: Icon, label, meta, detail }, index) => (
            <article className="perk-card" key={label}>
              <span className="perk-card-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="perk-icon-shell">
                <Icon size={22} />
              </span>
              <div className="perk-card-copy">
                <span>{meta}</span>
                <h3>{label}</h3>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="brand-showcase-section" aria-labelledby="brand-showcase-title">
        <div className="brand-showcase-inner">
          <div className="brand-showcase-heading">
            <div>
              <p className="eyebrow brand-showcase-eyebrow">Curated maisons</p>
              <h2 id="brand-showcase-title">Explore iconic watchmaking houses</h2>
            </div>
            <p>
              A considered edit of heritage manufacturers and innovative makers, selected for
              mechanical character, finishing quality, and historical significance.
            </p>
          </div>

          <div className="brand-showcase-meta" aria-label="Brand collection highlights">
            <div>
              <strong>{topWatchBrands.length}+</strong>
              <span>curated brands</span>
            </div>
            <div>
              <strong>Haute</strong>
              <span>horlogerie maisons</span>
            </div>
            <div>
              <strong>COSC</strong>
              <span>chronometers & divers</span>
            </div>
          </div>

          <div className="brand-marquee" aria-label="Popular global watch brands">
            <div className="brand-marquee-track">
              {[...topWatchBrands, ...topWatchBrands].map((brand, index) => (
                <Link
                  className="brand-logo-card"
                  to={`/products?brand=${encodeURIComponent(brand.name)}`}
                  key={`${brand.name}-${index}`}
                >
                  <span className="brand-card-index">{String((index % topWatchBrands.length) + 1).padStart(2, '0')}</span>
                  <span className={`brand-image-shell${brand.imageMode ? ` ${brand.imageMode}` : ''}`}>
                    <img src={brand.logo} alt={`${brand.name} brand logo`} loading="lazy" />
                  </span>
                  <strong>{brand.name}</strong>
                  <small>{brand.type}</small>
                </Link>
              ))}
            </div>
          </div>

          <div className="brand-showcase-footer">
            <span>Browse by brand, movement style, case profile, and daily-wear purpose.</span>
            <Link to="/products" className="button brand-view-button">
              View all brands
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="featured-watch-section" aria-labelledby="featured-watch-title">
        <div className="featured-watch-inner">
          <div className="featured-watch-heading">
            <div className="featured-watch-copy">
              <p className="eyebrow featured-watch-eyebrow">Featured watches</p>
              <h2 id="featured-watch-title">
                <span className="inline-brand">
                  lah<span className="brand-v">Venture</span>
                </span>{' '}
                picks
              </h2>
              <p>
                A focused edit of standout watches and smartwatches, selected for design,
                daily usability, and confident gifting.
              </p>
            </div>
            <Link to="/products?featured=true" className="featured-watch-link">
              More picks
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="featured-product-grid">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => <div className="skeleton-card" key={index} />)
              : featuredData?.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </div>
      </section>

      <PanoramicPhotoLibrary />
    </>
  );
};
