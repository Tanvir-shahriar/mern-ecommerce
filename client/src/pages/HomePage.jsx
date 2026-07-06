import { ArrowRight, Cpu, CreditCard, ShieldCheck, Timer, Truck, Play, Pause } from 'lucide-react';
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
import watch1 from '../assets/watches/1.png';
import watch2 from '../assets/watches/2.png';
import watch3 from '../assets/watches/3.png';
import watch4 from '../assets/watches/4.png';
import watch5 from '../assets/watches/5.png';
import watch6 from '../assets/watches/6.png';
import watch7 from '../assets/watches/7.png';
import watch8 from '../assets/watches/8.png';
import watchGearsVideo from '../assets/video/Watch face gears ticking.mp4';
import { api, mediaUrl } from '../services/api.js';
import { directCheckoutUrl, startDirectCheckout } from '../utils/directCheckout.js';

const watchSlides = [
  {
    image: watch4, // cowboy watch (4.png)
    badge: "LIMITED TO 30 PIECES",
    sku: "CH-67255-BKGO",
    title: ["FLYING GRAND", "REGULATOR", "SKELETON", "COWBOY"],
    slogan: "The Time Is Yours",
    subtext: "Shop our exquisite collection of luxury watches and elevate your style today",
    gradient: "radial-gradient(circle at 60% 50%, #2a1f15 0%, #0c0906 60%, #040302 100%)",
    accentColor: "#7a0b17", // Maroon / Cowboy Red
    accentColorRgb: "122, 11, 23",
    badgeBg: "rgba(255, 255, 255, 0.08)",
    badgeColor: "#dfc8ad",
    badgeBgTrans: "rgba(223, 200, 173, 0.1)",
    badgeBorderTrans: "rgba(223, 200, 173, 0.3)"
  },
  {
    image: watch1, // jubilee watch (1.png)
    badge: "LIMITED TO 50 PIECES",
    sku: "DJ-41-YGSS",
    title: ["OYSTER", "PERPETUAL", "DATEJUST"],
    slogan: "A Tribute to Elegance",
    subtext: "The classic timepiece of reference, featuring a distinct fluted bezel and gold-steel Jubilee bracelet.",
    gradient: "radial-gradient(circle at 60% 50%, #2f251b 0%, #0d0a08 60%, #050404 100%)",
    accentColor: "#d4af37", // Gold
    accentColorRgb: "212, 175, 55",
    badgeBg: "#3c3226",
    badgeColor: "#dfc8ad",
    badgeBgTrans: "rgba(212, 175, 55, 0.1)",
    badgeBorderTrans: "rgba(212, 175, 55, 0.3)"
  },
  {
    image: watch2, // speedmaster (2.png)
    badge: "RACING HERITAGE",
    sku: "SP-321-CH",
    title: ["SPEEDMASTER", "RACING", "CHRONOGRAPH"],
    slogan: "Beyond the Horizon",
    subtext: "A legendary racing chronograph celebrating precision, high-speed performance, and classic mechanical heritage.",
    gradient: "radial-gradient(circle at 60% 50%, #2c2d30 0%, #111215 60%, #08090a 100%)",
    accentColor: "#a6a9ad", // Steel/Silver
    accentColorRgb: "166, 169, 173",
    badgeBg: "#22252a",
    badgeColor: "#cccccc",
    badgeBgTrans: "rgba(166, 169, 173, 0.1)",
    badgeBorderTrans: "rgba(166, 169, 173, 0.3)"
  },
  {
    image: watch3, // blue watch (3.png)
    badge: "MODERN CLASSIC",
    sku: "RG-790-BL",
    title: ["ROYAL", "OCEAN", "BLUE"],
    slogan: "Elegance Reimagined",
    subtext: "The perfect contrast of a deep sunburst blue dial and warm hand-polished rose gold casing.",
    gradient: "radial-gradient(circle at 60% 50%, #151e2b 0%, #080c14 60%, #030509 100%)",
    accentColor: "#e0b0ff", // Rose Gold / Lilac
    accentColorRgb: "224, 176, 255",
    badgeBg: "#0f1622",
    badgeColor: "#a3c2f0",
    badgeBgTrans: "rgba(224, 176, 255, 0.1)",
    badgeBorderTrans: "rgba(224, 176, 255, 0.3)"
  },
  {
    image: watch5, // calatrava brown (5.png)
    badge: "MINIMALIST DRESS",
    sku: "CL-1950-BR",
    title: ["VINTAGE", "CALATRAVA", "SILVER"],
    slogan: "Understated Grace",
    subtext: "Clean white dial meets rich brown calfskin leather. An authentic tribute to mid-century horology.",
    gradient: "radial-gradient(circle at 60% 50%, #291e17 0%, #0f0b09 60%, #080605 100%)",
    accentColor: "#8b5a2b", // Brown
    accentColorRgb: "139, 90, 43",
    badgeBg: "#281b12",
    badgeColor: "#dfbe9b",
    badgeBgTrans: "rgba(139, 90, 43, 0.1)",
    badgeBorderTrans: "rgba(139, 90, 43, 0.3)"
  },
  {
    image: watch6, // emerald diver (6.png)
    badge: "DEEP DIVER",
    sku: "SUB-300-GR",
    title: ["EMERALD", "OCEAN", "HULK"],
    slogan: "Conquer the Depths",
    subtext: "Robust 300m water resistant case with a vibrant green ceramic bezel and matching sunburst green dial.",
    gradient: "radial-gradient(circle at 60% 50%, #12281a 0%, #07120c 60%, #030805 100%)",
    accentColor: "#10b981", // Emerald Green
    accentColorRgb: "16, 185, 129",
    badgeBg: "#0f2015",
    badgeColor: "#a7f3d0",
    badgeBgTrans: "rgba(16, 185, 129, 0.1)",
    badgeBorderTrans: "rgba(16, 185, 129, 0.3)"
  },
  {
    image: watch7, // gold cellini (7.png)
    badge: "HERITAGE TRADITION",
    sku: "CELL-90-YG",
    title: ["PRESTIGE", "CELLINI", "GOLD"],
    slogan: "Timeless Tradition",
    subtext: "A classic dress watch featuring a clean white dial, delicate gold markers, and a premium black alligator strap.",
    gradient: "radial-gradient(circle at 60% 50%, #2f271a 0%, #120e0a 60%, #070503 100%)",
    accentColor: "#eab308", // Yellow Gold
    accentColorRgb: "234, 179, 8",
    badgeBg: "#2e210f",
    badgeColor: "#fef08a",
    badgeBgTrans: "rgba(234, 179, 8, 0.1)",
    badgeBorderTrans: "rgba(234, 179, 8, 0.3)"
  },
  {
    image: watch8, // black/red sport (8.png)
    badge: "ATHLETIC SPORT",
    sku: "SP-X9-RED",
    title: ["CARBON", "ATHLETE", "RED"],
    slogan: "Engineered for Action",
    subtext: "High-grade matte black carbon case with racing red highlights and a sweat-proof heavy-duty silicone strap.",
    gradient: "radial-gradient(circle at 60% 50%, #2a0b0d 0%, #100405 60%, #050102 100%)",
    accentColor: "#ef4444", // Red
    accentColorRgb: "239, 68, 68",
    badgeBg: "#2d0b0f",
    badgeColor: "#fca5a5",
    badgeBgTrans: "rgba(239, 68, 68, 0.1)",
    badgeBorderTrans: "rgba(239, 68, 68, 0.3)"
  }
];

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

export const HomePage = () => {
  const [heroIndex, setHeroIndex] = useState(0);
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

  const activeWatchIndex = watchSlides.length ? heroIndex % watchSlides.length : 0;
  const activeWatch = watchSlides[activeWatchIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % watchSlides.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, []);

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
        style={{ background: activeWatch.gradient }}
      >
        <div 
          key={activeWatchIndex} 
          className="hero-content-custom animate-slide-up"
          style={{
            '--accent-color': activeWatch.accentColor,
            '--accent-color-rgb': activeWatch.accentColorRgb,
            '--badge-color': activeWatch.badgeColor,
            '--badge-bg': activeWatch.badgeBg,
            '--badge-bg-trans': activeWatch.badgeBgTrans,
            '--badge-border-trans': activeWatch.badgeBorderTrans
          }}
        >
          <span className="hero-badge-pill">{activeWatch.badge}</span>
          <span className="hero-sku">{activeWatch.sku}</span>
          <h1 className="hero-title-custom">
            {activeWatch.title.map((line, idx) => (
              <span key={idx}>{line}</span>
            ))}
          </h1>
          <h2 className="hero-slogan-custom">{activeWatch.slogan}</h2>
          
          <div className="hero-subtext-container">
            <span className="find-out-more-badge">FIND OUT MORE</span>
            <p className="hero-subtext-custom">{activeWatch.subtext}</p>
          </div>
          
          <Link to="/products" className="hero-shop-btn">
            SHOP
          </Link>
        </div>

        <div className="hero-visual-custom">
          <span className="hero-available-label">AVAILABLE</span>
          
          <div key={activeWatchIndex} className="hero-watch-container animate-fade-in-scale">
            <img 
              src={activeWatch.image} 
              alt={activeWatch.title.join(' ')} 
              className="hero-watch-image" 
            />
          </div>

          <div className="hero-video-widget">
            <img src="/watch_video_thumbnail.png" alt="Watch video preview" />
            <button className="play-button-custom" aria-label="Play video">
              <span className="play-icon-circle"></span>
            </button>
          </div>
        </div>

        <div className="hero-dots-container">
          {watchSlides.map((slide, idx) => (
            <button
              key={idx}
              onClick={() => setHeroIndex(idx)}
              className={`hero-dot-btn ${idx === activeWatchIndex ? 'active' : ''}`}
              style={{
                '--dot-accent': activeWatch.accentColor
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

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
