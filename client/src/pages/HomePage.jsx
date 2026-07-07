import { ArrowRight, Cpu, CreditCard, ShieldCheck, Timer, Truck, Play, Pause, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard.jsx';
import { PanoramicPhotoLibrary } from '../components/PanoramicPhotoLibrary.jsx';
import { SpiderClock } from '../components/SpiderClock.jsx';
import { Seo } from '../components/Seo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import patekLogoNew from '../assets/Logo/Patek-Philippe-Logo-1920s.png';
import seikoLogoNew from '../assets/Logo/png-transparent-seiko-hd-logo.png';
import omegaLogoNew from '../assets/Logo/0x0.png';
import radoLogo from '../assets/Logo/rado-logo-png_seeklogo-115398.png';
import fossilLogo from '../assets/Logo/png-clipart-fossil-group-watch-business-logo-watch.png';
import maxlordLogo from '../assets/Logo/images (2).jpg';
import soberLogo from '../assets/Logo/Gemini_Generated_Image_4hnyq84hnyq84hny.png';
import successWayBrandLogo from '../assets/Logo/Success way logo.jpg';
import watchGearsVideo from '../assets/video/Watch face gears ticking.mp4';
import { defaultHeroSlides } from '../data/heroDefaults.js';
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
  { name: 'Patek Philippe', logo: patekLogoNew, type: 'Haute Horlogerie' },
  { name: 'Seiko', logo: seikoLogoNew, type: 'Pioneering Innovation' },
  { name: 'Omega', logo: omegaLogoNew, type: 'Precision & Heritage' },
  { name: 'Rado', logo: radoLogo, type: 'Swiss Master of Materials' },
  { name: 'Fossil', logo: fossilLogo, type: 'Contemporary Fashion' },
  { name: 'Maxlord', logo: maxlordLogo, type: 'Distinctive Design' },
  { name: 'Sober', logo: soberLogo, type: 'Modern Minimalist' },
  { name: 'Success Way', logo: successWayBrandLogo, type: 'Curated Heritage' }
];

const patekFeature = {
  title: 'Mechanical Time in Motion',
  description: 'A closer look at the gears, rhythm, and finishing that give every serious timepiece its character.',
  ctaUrl: '/products',
  ctaText: 'Explore Watches',
  video: watchGearsVideo
};

const heroMediaUrl = (asset, fallback = '') => {
  const url = typeof asset === 'string' ? asset : asset?.url;
  if (!url) return fallback;
  return mediaUrl(url);
};

const titleLines = (title) => {
  if (Array.isArray(title)) return title.filter(Boolean);
  return String(title || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
};

export const HomePage = () => {
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeHeroVideo, setActiveHeroVideo] = useState(null);
  const [purchaseId, setPurchaseId] = useState('');
  const [isPatekPlaying, setIsPatekPlaying] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const patekVideoRef = useRef(null);

  const togglePatekVideo = () => {
    const video = patekVideoRef.current;
    if (!video) {
      setIsPatekPlaying((playing) => !playing);
      return;
    }

    if (video.paused) {
      video.play().then(() => setIsPatekPlaying(true)).catch(() => setIsPatekPlaying(false));
      return;
    }

    video.pause();
    setIsPatekPlaying(false);
  };

  const { data: featuredData, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await api.get('/products/featured', { params: { limit: 8 } });
      return data.data.products;
    }
  });

  const { data: heroData } = useQuery({
    queryKey: ['hero-settings'],
    queryFn: async () => {
      const { data } = await api.get('/hero');
      return data.data;
    },
    staleTime: 60 * 1000,
    retry: 1
  });

  const configuredHeroSlides = heroData?.slides?.length ? heroData.slides : defaultHeroSlides;
  const visibleHeroSlides = configuredHeroSlides.filter((slide) => slide.isActive !== false);
  const heroSlides = visibleHeroSlides.length ? visibleHeroSlides : defaultHeroSlides;
  const activeWatchIndex = heroSlides.length ? heroIndex % heroSlides.length : 0;
  const activeWatch = heroSlides[activeWatchIndex] || defaultHeroSlides[0];
  const activeTitleLines = titleLines(activeWatch.title);
  const activeImageUrl = heroMediaUrl(activeWatch.image);
  const activeVideoUrl = activeWatch.video?.url ? heroMediaUrl(activeWatch.video.url) : '';
  const activeVideoThumbnail = heroMediaUrl(activeWatch.video?.thumbnail, activeImageUrl);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % heroSlides.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroIndex >= heroSlides.length) setHeroIndex(0);
  }, [heroIndex, heroSlides.length]);

  useEffect(() => {
    if (!activeHeroVideo) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setActiveHeroVideo(null);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [activeHeroVideo]);

  const purchaseNow = (product) => {
    setPurchaseId(product._id);
    startDirectCheckout({ productId: product._id, quantity: 1 });

    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout', search: '?mode=buy-now' } } });
      return;
    }

    navigate(directCheckoutUrl);
  };

  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Store',
        '@id': `${window.location.origin}/#store`,
        'name': 'LahVenture Watches Bangladesh',
        'url': window.location.origin,
        'logo': `${window.location.origin}/Lahventure%20Logo.png`,
        'description': "Bangladesh's #1 luxury watch and smartwatch e-commerce shop featuring original mechanical timepieces and authentic smartwatches.",
        'currenciesAccepted': 'BDT',
        'paymentAccepted': 'Cash on Delivery, BKash, Card, Stripe',
        'priceRange': '৳৳৳',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': 'Dhaka',
          'addressCountry': 'BD'
        },
        'areaServed': {
          '@type': 'Country',
          'name': 'Bangladesh'
        }
      },
      {
        '@type': 'WebSite',
        '@id': `${window.location.origin}/#website`,
        'url': window.location.origin,
        'name': 'LahVenture Watches Bangladesh',
        'publisher': { '@id': `${window.location.origin}/#store` },
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${window.location.origin}/products?search={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Is Cash on Delivery available across Bangladesh?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes, LahVenture provides Cash on Delivery (COD) for luxury watches and smartwatches across Dhaka and all districts in Bangladesh.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Are all luxury watches at LahVenture 100% authentic?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'All mechanical timepieces, luxury chronographs, and smartwatches sold by LahVenture come with 100% authenticity guarantee and brand warranty.'
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <Seo
        title="LahVenture Watches | #1 Luxury Timepiece & Smartwatch Shop in Bangladesh"
        description="Bangladesh's #1 luxury watch and smartwatch e-commerce shop featuring original mechanical timepieces, Haute Horlogerie, and authentic smartwatches with cash on delivery."
        keywords="online shopping bangladesh, best e-commerce in bangladesh, luxury watches bangladesh, buy watch online dhaka, smartwatch price in bangladesh, original watches bd"
        schemaJson={homeSchema}
      />
      <section 
        className="hero-section" 
        style={{ background: activeWatch.gradient || defaultHeroSlides[0].gradient }}
      >
        <div 
          key={activeWatchIndex} 
          className="hero-content-custom animate-slide-up"
          style={{
            '--accent-color': activeWatch.accentColor || defaultHeroSlides[0].accentColor,
            '--accent-color-rgb': activeWatch.accentColorRgb || defaultHeroSlides[0].accentColorRgb,
            '--badge-color': activeWatch.badgeColor || defaultHeroSlides[0].badgeColor,
            '--badge-bg': activeWatch.badgeBg || defaultHeroSlides[0].badgeBg,
            '--badge-bg-trans': activeWatch.badgeBgTrans || defaultHeroSlides[0].badgeBgTrans,
            '--badge-border-trans': activeWatch.badgeBorderTrans || defaultHeroSlides[0].badgeBorderTrans
          }}
        >
          {activeWatch.badge ? <span className="hero-badge-pill">{activeWatch.badge}</span> : null}
          {activeWatch.sku ? <span className="hero-sku">{activeWatch.sku}</span> : null}
          <h1 className="hero-title-custom">
            {activeTitleLines.map((line, idx) => (
              <span key={idx}>{line}</span>
            ))}
          </h1>
          {activeWatch.slogan ? <h2 className="hero-slogan-custom">{activeWatch.slogan}</h2> : null}
          
          {activeWatch.subtext ? <div className="hero-subtext-container">
            <span className="find-out-more-badge">FIND OUT MORE</span>
            <p className="hero-subtext-custom">{activeWatch.subtext}</p>
          </div> : null}
          
          <Link to={activeWatch.ctaUrl || '/products'} className="hero-shop-btn">
            {activeWatch.ctaText || 'SHOP'}
          </Link>
        </div>

        <div className="hero-visual-custom">
          <span className="hero-available-label">AVAILABLE</span>
          
          <div key={activeWatchIndex} className="hero-watch-container animate-fade-in-scale">
            <img 
              src={activeImageUrl} 
              alt={activeWatch.image?.alt || activeTitleLines.join(' ') || 'Featured watch'} 
              className="hero-watch-image" 
            />
          </div>

          {activeVideoUrl ? (
            <button
              type="button"
              className="hero-video-widget"
              onClick={() => setActiveHeroVideo({
                url: activeVideoUrl,
                thumbnail: activeVideoThumbnail,
                title: activeWatch.video?.title || activeWatch.slogan || activeTitleLines.join(' ')
              })}
              aria-label={`Play ${activeWatch.video?.title || activeTitleLines.join(' ') || 'hero'} video`}
            >
              <img src={activeVideoThumbnail} alt={activeWatch.video?.alt || 'Watch video preview'} />
              <span className="play-button-custom" aria-hidden="true">
                <span className="play-icon-circle"></span>
              </span>
            </button>
          ) : null}
        </div>

        <div className="hero-dots-container">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.id || idx}
              onClick={() => setHeroIndex(idx)}
              className={`hero-dot-btn ${idx === activeWatchIndex ? 'active' : ''}`}
              style={{
                '--dot-accent': activeWatch.accentColor || defaultHeroSlides[0].accentColor
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {activeHeroVideo ? (
        <div className="hero-video-modal" role="dialog" aria-modal="true" aria-label={activeHeroVideo.title || 'Hero video player'} onClick={() => setActiveHeroVideo(null)}>
          <div className="hero-video-modal-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="hero-video-close" onClick={() => setActiveHeroVideo(null)} aria-label="Close video">
              <X size={20} />
            </button>
            <video src={activeHeroVideo.url} poster={activeHeroVideo.thumbnail} controls autoPlay playsInline />
          </div>
        </div>
      ) : null}

      <section className="patek-carousel-scroll-stage">
        <div className="hero-carousel_hero-carousel__bEV8J patek-hero-carousel">
          <div className="patek-carousel-track">
            <article className="hero-carousel-item_hero-carousel-item__d5OPU patek-carousel-item hero-carousel-item_--is-active active">
              <div className="hero-carousel-item_media-wrapper__u6xit patek-carousel-media-wrapper">
                <video
                  className="patek-video"
                  src={patekFeature.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  ref={patekVideoRef}
                  onPlay={() => setIsPatekPlaying(true)}
                  onPause={() => setIsPatekPlaying(false)}
                />
              </div>

              <div className="hero-carousel-item_background__t4Xol hero-carousel-item_--overlay-20__e2JiN patek-carousel-overlay" />

              <div className="hero-carousel-item_container__iKRW4 hero-carousel-item_--is-left__tnUic patek-carousel-content-container">
                <h2 className="hero-carousel-item_title__Rw_ym notranslate patek-carousel-title">
                  {patekFeature.title}
                </h2>
                <div className="hero-carousel-item_description__d6lT4 patek-carousel-description">
                  <p>{patekFeature.description}</p>
                </div>
                <div className="hero-carousel-item_cta-container__qsuy2 patek-carousel-cta-container">
                  <Link
                    to={patekFeature.ctaUrl}
                    className="cta_--is-white__0hlgs patek-carousel-cta"
                  >
                    {patekFeature.ctaText}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </article>
          </div>

          <div className="patek-carousel-controls">
            <button
              type="button"
              className="patek-play-pause-btn"
              onClick={togglePatekVideo}
              aria-label={isPatekPlaying ? 'Pause video' : 'Play video'}
            >
              {isPatekPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
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
            <Link to="/brands" className="button brand-view-button">
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
