import { ArrowRight, Cpu, CreditCard, ShieldCheck, Timer, Truck, Play, Pause, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import middleGarmentImage from '../assets/garments/d-(3).png';
import rightGarmentImage from '../assets/garments/m-1.png';
import middleGarmentImage2 from '../assets/garments/d-(5).png';
import rightGarmentImage2 from '../assets/garments/m-2.png';
import middleGarmentImage3 from '../assets/garments/d-(4).png';
import rightGarmentImage3 from '../assets/garments/m-3.png';
import rightGarmentImage4 from '../assets/garments/m-4.png';
import middleGarmentImage5 from '../assets/garments/d-6.png';
import rightGarmentImage5 from '../assets/garments/m-5.png';
import middleGarmentImage6 from '../assets/garments/d-(1).png';
import rightGarmentImage6 from '../assets/garments/m-6.png';
import middleGarmentImage7 from '../assets/garments/d-2.png';
import rightGarmentImage7 from '../assets/garments/m-7.png';
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

const PROMO_SLIDE_COUNT = 7;
const PROMO_INITIAL_DELAY = 4000;
const PROMO_SLIDE_DELAY = 5000;
const PROMO_TRANSITION_DURATION = 1450;

const heroMediaUrl = (asset, fallback = '') => {
  const url = typeof asset === 'string' ? asset : asset?.url;
  if (!url) return fallback;
  return mediaUrl(url);
};

const titleLines = (title) => {
  if (Array.isArray(title)) return title.filter(Boolean);
  return String(title || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
};

const heroThemeVariables = (slide) => ({
  '--accent-color': slide.accentColor || defaultHeroSlides[0].accentColor,
  '--accent-color-rgb': slide.accentColorRgb || defaultHeroSlides[0].accentColorRgb,
  '--badge-color': slide.badgeColor || defaultHeroSlides[0].badgeColor,
  '--badge-bg': slide.badgeBg || defaultHeroSlides[0].badgeBg,
  '--badge-bg-trans': slide.badgeBgTrans || defaultHeroSlides[0].badgeBgTrans,
  '--badge-border-trans': slide.badgeBorderTrans || defaultHeroSlides[0].badgeBorderTrans
});

const HeroCopy = ({ slide, state }) => {
  const lines = titleLines(slide.title);
  const isLeaving = state === 'leaving';

  return (
    <div
      className={`hero-content-custom hero-is-${state}`}
      style={heroThemeVariables(slide)}
      aria-hidden={isLeaving ? 'true' : undefined}
    >
      {slide.badge ? <span className="hero-badge-pill">{slide.badge}</span> : null}
      {slide.sku ? <span className="hero-sku">{slide.sku}</span> : null}
      <h1 className="hero-title-custom">
        {lines.map((line, index) => <span key={index}>{line}</span>)}
      </h1>
      {slide.slogan ? <h2 className="hero-slogan-custom">{slide.slogan}</h2> : null}
      {slide.subtext ? (
        <div className="hero-subtext-container">
          <span className="find-out-more-badge">FIND OUT MORE</span>
          <p className="hero-subtext-custom">{slide.subtext}</p>
        </div>
      ) : null}
      <Link
        to={slide.ctaUrl || '/products'}
        className="hero-shop-btn"
        tabIndex={isLeaving ? -1 : undefined}
      >
        {slide.ctaText || 'SHOP'}
      </Link>
    </div>
  );
};

const HeroVisual = ({ slide, imageUrl, state, onImageLoad, onPlayVideo }) => {
  const isLeaving = state === 'leaving';
  const videoUrl = slide.video?.url ? heroMediaUrl(slide.video.url) : '';
  const thumbnail = heroMediaUrl(slide.video?.thumbnail, imageUrl);
  const lines = titleLines(slide.title);

  return (
    <div className={`hero-visual-custom hero-is-${state}`} aria-hidden={isLeaving ? 'true' : undefined}>
      {!isLeaving ? <span className="hero-available-label">AVAILABLE</span> : null}

      <div className={`hero-watch-container hero-watch-is-${state}`}>
        <img
          src={imageUrl}
          alt={isLeaving ? '' : (slide.image?.alt || lines.join(' ') || 'Featured watch')}
          className="hero-watch-image"
          onLoad={onImageLoad}
        />
      </div>

      {!isLeaving && videoUrl ? (
        <button
          type="button"
          className="hero-video-widget"
          onClick={() => onPlayVideo({
            url: videoUrl,
            thumbnail,
            title: slide.video?.title || slide.slogan || lines.join(' ')
          })}
          aria-label={`Play ${slide.video?.title || lines.join(' ') || 'hero'} video`}
        >
          <img src={thumbnail} alt={slide.video?.alt || 'Watch video preview'} />
          <span className="play-button-custom" aria-hidden="true">
            <span className="play-icon-circle"></span>
          </span>
        </button>
      ) : null}
    </div>
  );
};

export const HomePage = () => {
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroSequence, setHeroSequence] = useState(0);
  const [heroDirection, setHeroDirection] = useState(1);
  const [leavingHero, setLeavingHero] = useState(null);
  const [activeHeroVideo, setActiveHeroVideo] = useState(null);
  const [purchaseId, setPurchaseId] = useState('');
  const [isPatekPlaying, setIsPatekPlaying] = useState(true);
  const homePageRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const promoSlides = [
    {
      id: 'boston',
      title: (
        <>
          <span className="gradient-green">Boston</span>
          <span className="dark-green">Relaxed</span>
          <span className="gradient-green">Fit T-shirt</span>
        </>
      ),
      description: 'Designed with a modern, relaxed fit and a classic crew neck. Perfect for a casual, drop-shoulder look that maximizes both style and comfort.',
      middleImage: middleGarmentImage,
      rightImage: rightGarmentImage,
      modelAspectRatio: '822 / 1092',
      themeClass: 'promo-theme-boston',
      accent: '#123C24',
      altRight: 'Model wearing Boston relaxed fit t-shirt'
    },
    {
      id: 'undici',
      title: (
        <>
          <span className="gradient-gold">"Undici"</span>
          <span className="dark-gold">Gothic</span>
          <span className="gradient-gold">T-Shirt</span>
        </>
      ),
      description: 'A contemporary, relaxed silhouette with a classic crew neck and comfortable mid-length sleeves. Designed to offer a premium casual look for anyone.',
      middleImage: middleGarmentImage2,
      rightImage: rightGarmentImage2,
      modelAspectRatio: '702 / 1257',
      themeClass: 'promo-theme-undici',
      accent: '#59421A',
      altRight: 'Model wearing Undici gothic t-shirt'
    },
    {
      id: 'retro',
      title: (
        <>
          <span className="gradient-plum">Retro</span>
          <span className="dark-plum">Minimalist</span>
          <span className="gradient-plum">T-Shirt</span>
        </>
      ),
      description: 'An ultra-modern, boxy oversized fit with wide mid-length sleeves and a thick, durable crew neck collar.',
      middleImage: middleGarmentImage3,
      rightImage: rightGarmentImage3,
      modelAspectRatio: '2653 / 3544',
      themeClass: 'promo-theme-retro',
      accent: '#591437',
      altRight: 'Model wearing Retro Minimalist t-shirt'
    },
    {
      id: 'athletic',
      title: (
        <>
          <span className="gradient-green">Retro</span>
          <span className="dark-green">Athletic</span>
          <span className="gradient-green">T-Shirt</span>
        </>
      ),
      description: 'Contemporary classic fit and a premium-quality jersey-style "07" block print in rich forest green, detailed with a clean white and silver outline and minimalist accent stripes.',
      middleImage: middleGarmentImage,
      rightImage: rightGarmentImage4,
      modelAspectRatio: '705 / 1062',
      themeClass: 'promo-theme-athletic',
      accent: '#123C24',
      altRight: 'Model wearing Retro Athletic t-shirt'
    },
    {
      id: 'eclipse',
      title: (
        <>
          <span className="gradient-silver">Eclipse</span>
          <span className="dark-silver">Two-Tone</span>
          <span className="gradient-silver">Hoodie</span>
        </>
      ),
      description: 'An ultra-thick, premium heavyweight fleece fabric designed to hold its dramatic shape. Comes with a structured, double-lined hood and a seamless kangaroo pocket.',
      middleImage: middleGarmentImage5,
      rightImage: rightGarmentImage5,
      modelAspectRatio: '762 / 1146',
      themeClass: 'promo-theme-eclipse',
      accent: '#6B6256',
      altRight: 'Model wearing Eclipse two-tone hoodie'
    },
    {
      id: 'crimson',
      title: (
        <>
          <span className="gradient-crimson">Crimson</span>
          <span className="dark-crimson">Script</span>
          <span className="gradient-crimson">Hoodie</span>
        </>
      ),
      description: 'Designed with a structural, slouchy oversized silhouette featuring heavily dropped shoulders and extra-roomy sleeves. Equipped with a double-layered hood and a classic kangaroo pocket.',
      middleImage: middleGarmentImage6,
      rightImage: rightGarmentImage6,
      modelAspectRatio: '789 / 1182',
      themeClass: 'promo-theme-crimson',
      accent: '#58111A',
      altRight: 'Model wearing Crimson Script hoodie'
    },
    {
      id: 'bluetech',
      title: (
        <>
          <span className="gradient-bluetech">Oversized</span>
          <span className="dark-bluetech">BlueTech</span>
          <span className="gradient-bluetech">Hoodie</span>
        </>
      ),
      description: 'A trendy drop-shoulder, oversized silhouette for a relaxed and comfortable feel. Comes with a spacious kangaroo pocket at the front.',
      middleImage: middleGarmentImage7,
      rightImage: rightGarmentImage7,
      modelAspectRatio: '792 / 1188',
      themeClass: 'promo-theme-bluetech',
      accent: '#1F3E5A',
      altRight: 'Model wearing Oversized BlueTech hoodie'
    }
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [leavingSlide, setLeavingSlide] = useState(null);
  const [promoSequence, setPromoSequence] = useState(0);
  const [isPromoVisible, setIsPromoVisible] = useState(false);
  const [hasPromoEntered, setHasPromoEntered] = useState(false);
  const [isPromoPaused, setIsPromoPaused] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const promoSectionRef = useRef(null);
  const activeSlideRef = useRef(0);
  const promoTransitionTimerRef = useRef(null);
  const promoPointerStartRef = useRef(null);

  const goToPromoSlide = useCallback((requestedIndex) => {
    const nextIndex = (requestedIndex + PROMO_SLIDE_COUNT) % PROMO_SLIDE_COUNT;
    const currentIndex = activeSlideRef.current;

    if (nextIndex === currentIndex) return;

    if (promoTransitionTimerRef.current) {
      window.clearTimeout(promoTransitionTimerRef.current);
    }

    setLeavingSlide(currentIndex);
    activeSlideRef.current = nextIndex;
    setActiveSlide(nextIndex);
    setPromoSequence((sequence) => sequence + 1);

    promoTransitionTimerRef.current = window.setTimeout(() => {
      setLeavingSlide(null);
      promoTransitionTimerRef.current = null;
    }, PROMO_TRANSITION_DURATION);
  }, []);

  useEffect(() => {
    const section = promoSectionRef.current;
    if (!section || !('IntersectionObserver' in window)) {
      setIsPromoVisible(true);
      setHasPromoEntered(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPromoVisible(entry.isIntersecting);
        if (entry.isIntersecting) setHasPromoEntered(true);
      },
      { threshold: 0.18 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener('change', updateMotionPreference);
    return () => mediaQuery.removeEventListener('change', updateMotionPreference);
  }, []);

  useEffect(() => {
    if (!isPromoVisible || isPromoPaused || !isDocumentVisible || prefersReducedMotion) {
      return undefined;
    }

    const delay = promoSequence === 0 ? PROMO_INITIAL_DELAY : PROMO_SLIDE_DELAY;
    const timer = window.setTimeout(() => {
      goToPromoSlide(activeSlideRef.current + 1);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [activeSlide, goToPromoSlide, isDocumentVisible, isPromoPaused, isPromoVisible, prefersReducedMotion, promoSequence]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden);
    };

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => () => {
    if (promoTransitionTimerRef.current) {
      window.clearTimeout(promoTransitionTimerRef.current);
    }
  }, []);

  const handlePromoPointerDown = (event) => {
    if (event.pointerType === 'mouse') return;
    promoPointerStartRef.current = { x: event.clientX, y: event.clientY };
    setIsPromoPaused(true);
  };

  const handlePromoPointerUp = (event) => {
    const start = promoPointerStartRef.current;
    promoPointerStartRef.current = null;
    setIsPromoPaused(false);
    if (!start) return;

    const distanceX = event.clientX - start.x;
    const distanceY = event.clientY - start.y;
    if (Math.abs(distanceX) < 46 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
    goToPromoSlide(activeSlideRef.current + (distanceX < 0 ? 1 : -1));
  };

  const handlePromoPointerCancel = () => {
    promoPointerStartRef.current = null;
    setIsPromoPaused(false);
  };

  const handlePromoKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    goToPromoSlide(activeSlideRef.current + (event.key === 'ArrowRight' ? 1 : -1));
  };

  const patekVideoRef = useRef(null);
  const heroSlidesRef = useRef([]);
  const heroIndexRef = useRef(0);
  const heroImageLoadRequestsRef = useRef(new Map());
  const loadedHeroImagesRef = useRef(new Set());
  const heroTransitionRequestRef = useRef(0);
  const heroExitTimerRef = useRef(null);
  const isHeroMountedRef = useRef(true);

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
  const activeImageUrl = heroMediaUrl(activeWatch.image);

  const rememberHeroImageLoaded = (imageUrl) => {
    if (imageUrl) {
      loadedHeroImagesRef.current.add(imageUrl);
    }
  };

  const loadHeroImage = (imageUrl) => {
    if (!imageUrl || loadedHeroImagesRef.current.has(imageUrl)) {
      return Promise.resolve(true);
    }

    const existingRequest = heroImageLoadRequestsRef.current.get(imageUrl);
    if (existingRequest) {
      return existingRequest;
    }

    const request = new Promise((resolve) => {
      const preloadImage = new Image();

      preloadImage.onload = () => {
        rememberHeroImageLoaded(imageUrl);
        heroImageLoadRequestsRef.current.delete(imageUrl);
        resolve(true);
      };

      preloadImage.onerror = () => {
        heroImageLoadRequestsRef.current.delete(imageUrl);
        resolve(false);
      };

      preloadImage.src = imageUrl;
    });

    heroImageLoadRequestsRef.current.set(imageUrl, request);
    return request;
  };

  const showHeroSlideWhenReady = (targetIndex) => {
    const slides = heroSlidesRef.current;
    if (!slides.length) return;

    const normalizedIndex = ((targetIndex % slides.length) + slides.length) % slides.length;
    if (normalizedIndex === heroIndexRef.current) return;

    const targetImageUrl = heroMediaUrl(slides[normalizedIndex]?.image);
    const requestId = ++heroTransitionRequestRef.current;

    loadHeroImage(targetImageUrl).then((isLoaded) => {
      if (!isHeroMountedRef.current || requestId !== heroTransitionRequestRef.current || !isLoaded) {
        return;
      }

      const currentIndex = heroIndexRef.current;
      if (normalizedIndex === currentIndex) return;

      const outgoingSlide = slides[currentIndex];
      const forwardDistance = (normalizedIndex - currentIndex + slides.length) % slides.length;
      const direction = forwardDistance <= slides.length / 2 ? 1 : -1;

      if (heroExitTimerRef.current) {
        window.clearTimeout(heroExitTimerRef.current);
      }

      if (outgoingSlide) {
        setLeavingHero({
          slide: outgoingSlide,
          imageUrl: heroMediaUrl(outgoingSlide.image),
          sequence: requestId
        });
      }

      setHeroDirection(direction);
      heroIndexRef.current = normalizedIndex;
      setHeroIndex(normalizedIndex);
      setHeroSequence((sequence) => sequence + 1);

      heroExitTimerRef.current = window.setTimeout(() => {
        setLeavingHero(null);
        heroExitTimerRef.current = null;
      }, 1200);
    });
  };

  useEffect(() => {
    isHeroMountedRef.current = true;

    return () => {
      isHeroMountedRef.current = false;
      heroImageLoadRequestsRef.current.clear();
      if (heroExitTimerRef.current) {
        window.clearTimeout(heroExitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    heroSlidesRef.current = heroSlides;
  }, [heroSlides]);

  useEffect(() => {
    heroIndexRef.current = activeWatchIndex;
  }, [activeWatchIndex]);

  useEffect(() => {
    loadHeroImage(activeImageUrl);

    const nextSlide = heroSlides[(activeWatchIndex + 1) % heroSlides.length];
    if (nextSlide) {
      loadHeroImage(heroMediaUrl(nextSlide.image));
    }
  }, [activeImageUrl, activeWatchIndex, heroSlides]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      const slides = heroSlidesRef.current;
      if (slides.length <= 1) return;

      showHeroSlideWhenReady((heroIndexRef.current + 1) % slides.length);
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

  useEffect(() => {
    const root = homePageRef.current;
    if (!root) return undefined;

    const sections = [...root.querySelectorAll([
      '.patek-carousel-scroll-stage',
      '.lahv-signature-section',
      '.spider-clock-section',
      '.perks-bar',
      '.brand-showcase-section',
      '.featured-watch-section'
    ].join(','))];

    root.classList.add('home-motion-ready');
    sections.forEach((section) => section.classList.add('home-motion-section'));

    const revealAll = () => {
      sections.forEach((section) => section.classList.add('home-motion-visible'));
    };

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || !('IntersectionObserver' in window)
    ) {
      revealAll();
      return () => root.classList.remove('home-motion-ready');
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('home-motion-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      root.classList.remove('home-motion-ready');
    };
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
      <div className="home-page home-light-theme" ref={homePageRef}>
      <section 
        className={`hero-section ${heroDirection > 0 ? 'hero-direction-forward' : 'hero-direction-backward'}`}
        style={{
          background: activeWatch.gradient || defaultHeroSlides[0].gradient,
          '--hero-direction': heroDirection
        }}
      >
        <HeroCopy
          key={`hero-copy-${activeWatch.id || activeWatchIndex}-${heroSequence}`}
          slide={activeWatch}
          state="active"
        />

        {leavingHero ? (
          <HeroCopy
            key={`hero-copy-leaving-${leavingHero.sequence}`}
            slide={leavingHero.slide}
            state="leaving"
          />
        ) : null}

        <HeroVisual
          key={`hero-visual-${activeWatch.id || activeWatchIndex}-${heroSequence}`}
          slide={activeWatch}
          imageUrl={activeImageUrl}
          state="active"
          onImageLoad={() => rememberHeroImageLoaded(activeImageUrl)}
          onPlayVideo={setActiveHeroVideo}
        />

        {leavingHero ? (
          <HeroVisual
            key={`hero-visual-leaving-${leavingHero.sequence}`}
            slide={leavingHero.slide}
            imageUrl={leavingHero.imageUrl}
            state="leaving"
            onPlayVideo={setActiveHeroVideo}
          />
        ) : null}

        <div className="hero-dots-container">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.id || idx}
              onClick={() => showHeroSlideWhenReady(idx)}
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

      <PanoramicPhotoLibrary />

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

      <section
        ref={promoSectionRef}
        className={`garment-promo-section ${hasPromoEntered ? 'has-entered' : ''} ${isPromoPaused ? 'is-paused' : ''}`}
        aria-label="Featured garment collection"
        aria-roledescription="carousel"
        onKeyDown={handlePromoKeyDown}
        onMouseEnter={() => setIsPromoPaused(true)}
        onMouseLeave={(event) => {
          if (!event.currentTarget.contains(document.activeElement)) setIsPromoPaused(false);
        }}
        onFocusCapture={() => setIsPromoPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.matches(':hover')) {
            setIsPromoPaused(false);
          }
        }}
        onPointerDown={handlePromoPointerDown}
        onPointerUp={handlePromoPointerUp}
        onPointerCancel={handlePromoPointerCancel}
      >
        {promoSlides.map((slide, index) => {
          const isActive = activeSlide === index;
          const isLeaving = leavingSlide === index;
          const isInitial = promoSequence === 0 && isActive;
          return (
            <div
              key={slide.id}
              className={`garment-promo-slide ${slide.themeClass} ${isActive ? 'is-active' : ''} ${isLeaving ? 'is-leaving' : ''} ${isInitial ? 'is-initial' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${promoSlides.length}`}
              aria-hidden={!isActive}
            >
              <div className="garment-promo-content">
                <h2 className="garment-promo-title">{slide.title}</h2>
                <p className="garment-promo-desc">{slide.description}</p>
              </div>
              <div className="garment-promo-middle-media" aria-hidden="true">
                <div className="garment-promo-middle-rotator">
                  <img
                    src={slide.middleImage}
                    alt=""
                    className="garment-promo-middle-img"
                    loading={index < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </div>
              </div>
              <div
                className="garment-promo-right-media"
                style={{ '--promo-model-ratio': slide.modelAspectRatio }}
              >
                <img
                  src={slide.rightImage}
                  alt={slide.altRight}
                  className="garment-promo-right-img"
                  loading={index < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            </div>
          );
        })}
        <div className="promo-slider-dots" role="group" aria-label="Choose garment slide">
          {promoSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`promo-slider-dot ${activeSlide === index ? 'is-active' : ''}`}
              onClick={() => goToPromoSlide(index)}
              aria-label={`Show ${slide.id} garment slide`}
              aria-current={activeSlide === index ? 'true' : undefined}
              style={{ '--promo-dot-color': slide.accent }}
            />
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

      </div>
    </>
  );
};
