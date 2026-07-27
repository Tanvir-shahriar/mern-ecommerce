import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Eye, Heart } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import heroFinalFrame from '../assets/images/hero-female-model-final.avif';
import heroMotionFrame from '../assets/images/hero-female-model-motion.avif';
import heroOpeningFrame from '../assets/images/hero-female-model-opening.avif';
import consideredSilhouetteImage from '../assets/images/editorial/considered-silhouette.webp';
import lookbookEveningImage from '../assets/images/editorial/lookbook/look-06-evening.webp';
import lookbookKnitwearImage from '../assets/images/editorial/lookbook/look-05-knitwear.webp';
import lookbookLongOvercoatImage from '../assets/images/editorial/lookbook/look-02-long-overcoat.webp';
import lookbookSlipImage from '../assets/images/editorial/lookbook/look-04-the-slip.webp';
import lookbookSoftTailoringImage from '../assets/images/editorial/lookbook/look-03-soft-tailoring.webp';
import winterCampaignImage from '../assets/images/editorial/winter-campaign.webp';
import categoryOuterwearImage from '../assets/images/editorial/categories/outerwear.jpg';
import categoryKnitwearImage from '../assets/images/editorial/categories/knitwear.jpg';
import categoryDressesImage from '../assets/images/editorial/categories/dresses.jpg';
import categoryAccessoriesImage from '../assets/images/editorial/categories/accessories.jpg';
import madeByHandAtelierImage from '../assets/images/editorial/made-by-hand-atelier.jpg';
import editCamelCoatImage from '../assets/images/editorial/the-edit/camel-wool-coat.jpg';
import editTrenchCoatImage from '../assets/images/editorial/the-edit/oversized-trench-coat.jpg';
import editLeatherToteImage from '../assets/images/editorial/the-edit/leather-tote-bag.jpg';
import editSilkDressImage from '../assets/images/editorial/the-edit/silk-slip-dress.jpg';

import { LiquidHoverCanvas } from '../components/LiquidHoverCanvas.jsx';
import { Seo } from '../components/Seo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';

const CATEGORY_ITEMS = [
  {
    id: 'outerwear',
    title: 'Outerwear',
    subtitle: 'SHOP NOW',
    image: categoryOuterwearImage,
    link: '/products?category=outerwear',
    alt: 'Tailored luxury outerwear coat'
  },
  {
    id: 'knitwear',
    title: 'Knitwear',
    subtitle: 'SHOP NOW',
    image: categoryKnitwearImage,
    link: '/products?category=knitwear',
    alt: 'Chunky cream ribbed turtleneck sweater'
  },
  {
    id: 'dresses',
    title: 'Dresses',
    subtitle: 'SHOP NOW',
    image: categoryDressesImage,
    link: '/products?category=dresses',
    alt: 'Flowing silk champagne slip dress'
  },
  {
    id: 'accessories',
    title: 'Accessories',
    subtitle: 'SHOP NOW',
    image: categoryAccessoriesImage,
    link: '/products?category=accessories',
    alt: 'Rich tan brown leather tote bag and fine jewelry'
  }
];

const EDIT_PRODUCTS = [
  {
    id: 'camel-wool-coat',
    title: 'The Camel Wool Coat',
    price: 890,
    color: 'Camel',
    badge: 'NEW',
    image: editCamelCoatImage,
    link: '/products?category=outerwear',
    alt: 'The Camel Wool Coat'
  },
  {
    id: 'oversized-trench-coat',
    title: 'Oversized Trench Coat',
    price: 760,
    originalPrice: 950,
    color: 'Sand',
    image: editTrenchCoatImage,
    link: '/products?category=outerwear',
    alt: 'Oversized Trench Coat in Sand'
  },
  {
    id: 'leather-tote-bag',
    title: 'Leather Tote Bag',
    price: 540,
    color: 'Tan',
    image: editLeatherToteImage,
    link: '/products?category=accessories',
    alt: 'Structured Leather Tote Bag in Tan'
  },
  {
    id: 'silk-slip-dress',
    title: 'Silk Slip Dress',
    price: 420,
    color: 'Champagne',
    image: editSilkDressImage,
    link: '/products?category=dresses',
    alt: 'Silk Slip Dress in Champagne'
  }
];


const WORDMARK = 'LAHVENTURE';
const HERO_FRAMES = [
  heroOpeningFrame,
  heroMotionFrame,
  heroFinalFrame
];
const DESKTOP_FOCAL_POINTS = [
  [0.5, 0.1],
  [0.5, 0.1],
  [0.5, 0.42]
];
const MOBILE_FOCAL_POINTS = [
  [0.38, 0.08],
  [0.38, 0.08],
  [0.5, 0.45]
];
const MARQUEE_ITEMS = [
  'Outerwear',
  'Knitwear',
  'Dresses',
  'Accessories',
  'New arrivals'
];
const LOOK_HOTSPOTS = [
  {
    left: '47%',
    top: '26%',
    popoverPosition: 'below'
  },
  {
    left: '40%',
    top: '70%',
    popoverPosition: 'above'
  },
  {
    left: '63%',
    top: '50%',
    popoverPosition: 'left'
  }
];
const LOOKBOOK_SLIDES = [
  {
    label: 'Look 01',
    title: 'The Camel Coat',
    image: consideredSilhouetteImage,
    alt: 'Camel coat styled with ivory knitwear and tailored trousers'
  },
  {
    label: 'Look 02',
    title: 'Long Overcoat',
    image: lookbookLongOvercoatImage,
    alt: 'Long ivory overcoat layered over soft winter tailoring'
  },
  {
    label: 'Look 03',
    title: 'Soft Tailoring',
    image: lookbookSoftTailoringImage,
    alt: 'Soft stone tailoring layered over a flowing silk dress'
  },
  {
    label: 'Look 04',
    title: 'The Slip',
    image: lookbookSlipImage,
    alt: 'Champagne silk slip dress in a warm architectural studio'
  },
  {
    label: 'Look 05',
    title: 'Knitwear Edit',
    image: lookbookKnitwearImage,
    alt: 'Oversized ivory knitwear with fluid cream trousers'
  },
  {
    label: 'Look 06',
    title: 'Evening',
    image: lookbookEveningImage,
    alt: 'Minimal ivory evening look in a softly lit studio'
  }
];

const clamp = (value, minimum = 0, maximum = 1) => (
  Math.min(maximum, Math.max(minimum, value))
);

const easeInOutQuad = (value) => (
  value < 0.5
    ? 2 * value * value
    : 1 - ((-2 * value + 2) ** 2) / 2
);

const productMeta = (product) => {
  const colorAttribute = (product.attributes || []).find((attribute) => (
    /colou?r/i.test(attribute?.name || '')
  ));
  const colorVariant = (product.variants || []).find((variant) => (
    /colou?r/i.test(variant?.name || '') && variant.options?.length
  ));

  return (
    colorAttribute?.value
    || colorVariant?.options?.[0]
    || product.brand
    || product.category?.name
    || ''
  );
};

const applyNewInImageFallback = (event, fallbackUrl) => {
  const image = event.currentTarget;
  const alternateUrl = mediaUrl(fallbackUrl);

  if (
    !image.dataset.newInFallback
    && fallbackUrl
    && image.currentSrc !== alternateUrl
  ) {
    image.dataset.newInFallback = 'alternate';
    image.src = alternateUrl;
    return;
  }

  if (image.dataset.newInFallback !== 'hero') {
    image.dataset.newInFallback = 'hero';
    image.src = heroFinalFrame;
  }
};

const NewInProductCard = ({ product, index, formatMoney }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { addItem } = useCart();
  const resetLabelTimerRef = useRef(null);
  const [cartLabel, setCartLabel] = useState('Add to bag');
  const [statusMessage, setStatusMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);

  const productUrl = `/products/${product.slug || product._id}`;
  const primaryImage = product.images?.[0];
  const secondaryImage = product.images?.[1] || primaryImage;
  const inStock = product.inventory?.trackQuantity === false
    || Number(product.inventory?.stock || 0) > 0;
  const hasOptions = (product.variants || []).some((variant) => (
    variant.name && variant.options?.length
  ));
  const isWishlisted = user?.wishlist?.some(
    (item) => (typeof item === 'string' ? item : item?._id) === product._id
  );

  useEffect(() => () => {
    if (resetLabelTimerRef.current) {
      window.clearTimeout(resetLabelTimerRef.current);
    }
  }, []);

  const resetCartLabelAfterDelay = () => {
    if (resetLabelTimerRef.current) {
      window.clearTimeout(resetLabelTimerRef.current);
    }
    resetLabelTimerRef.current = window.setTimeout(() => {
      setCartLabel('Add to bag');
    }, 1600);
  };

  const handleAddToBag = async () => {
    if (!inStock || authLoading) return;
    if (hasOptions) {
      navigate(productUrl);
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }

    setIsAdding(true);
    setCartLabel('Adding');
    try {
      await addItem(product._id, 1);
      refreshUser?.();
      setCartLabel('Added');
      setStatusMessage(`${product.name} added to your bag.`);
    } catch (error) {
      setCartLabel('Try again');
      setStatusMessage(apiErrorMessage(error));
    } finally {
      setIsAdding(false);
      resetCartLabelAfterDelay();
    }
  };

  const handleWishlist = async () => {
    if (authLoading || isUpdatingWishlist) return;
    if (!user) {
      navigate('/login');
      return;
    }

    setIsUpdatingWishlist(true);
    try {
      await api.post(`/users/wishlist/${product._id}`);
      await refreshUser?.();
      setStatusMessage(`${product.name} wishlist updated.`);
    } catch (error) {
      setStatusMessage(apiErrorMessage(error));
    } finally {
      setIsUpdatingWishlist(false);
    }
  };

  return (
    <div className="alt-home-new-in__card-stage">
      <article className="alt-home-new-in__card">
        <div className="alt-home-new-in__media">
          <Link
            className="alt-home-new-in__media-link"
            to={productUrl}
            data-alt-cursor="active"
            data-alt-cursor-label="View"
            aria-label={`View ${product.name}`}
          >
            <img
              className="alt-home-new-in__image alt-home-new-in__image--primary"
              src={mediaUrl(primaryImage?.url)}
              alt={primaryImage?.alt || product.name}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                applyNewInImageFallback(event, secondaryImage?.url);
              }}
            />
            <img
              className="alt-home-new-in__image alt-home-new-in__image--secondary"
              src={mediaUrl(secondaryImage?.url)}
              alt=""
              loading="lazy"
              decoding="async"
              aria-hidden="true"
              onError={(event) => {
                applyNewInImageFallback(event, primaryImage?.url);
              }}
            />
          </Link>

          {index < 2 ? (
            <span className="alt-home-new-in__badge">New</span>
          ) : null}

          <button
            className="alt-home-new-in__media-action alt-home-new-in__media-action--view"
            type="button"
            onClick={() => navigate(productUrl)}
            data-alt-cursor="active"
            data-alt-cursor-label="View"
            aria-label={`Quick view ${product.name}`}
          >
            <Eye size={17} strokeWidth={1.4} aria-hidden="true" />
          </button>

          <button
            className="alt-home-new-in__media-action alt-home-new-in__media-action--wishlist"
            type="button"
            onClick={handleWishlist}
            disabled={authLoading || isUpdatingWishlist}
            data-alt-cursor="active"
            data-alt-cursor-label={isWishlisted ? 'Saved' : 'Save'}
            aria-label={`${isWishlisted ? 'Remove' : 'Add'} ${product.name} ${
              isWishlisted ? 'from' : 'to'
            } wishlist`}
          >
            <Heart
              size={17}
              strokeWidth={1.4}
              fill={isWishlisted ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>

          <div className="alt-home-new-in__bag-wrap">
            <button
              className="alt-home-new-in__bag"
              type="button"
              onClick={handleAddToBag}
              disabled={isAdding || authLoading || !inStock}
              data-alt-cursor="active"
              data-alt-cursor-label={
                !inStock ? 'Sold' : hasOptions ? 'View' : 'Add'
              }
            >
              {!inStock
                ? 'Sold out'
                : hasOptions
                  ? 'Choose options'
                  : cartLabel}
            </button>
          </div>
        </div>

        <div className="alt-home-new-in__details">
          <Link className="alt-home-new-in__name" to={productUrl}>
            {product.name}
          </Link>
          <div className="alt-home-new-in__meta-row">
            <span className="alt-home-new-in__price">
              {formatMoney(product.price)}
            </span>
            <span className="alt-home-new-in__meta">
              {productMeta(product)}
            </span>
          </div>
        </div>

        <span className="sr-only" aria-live="polite">
          {statusMessage}
        </span>
      </article>
    </div>
  );
};

const CampaignStorySection = ({ reduceMotion }) => {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const [isVisible, setIsVisible] = useState(reduceMotion);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.4 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    if (!section || !image) return undefined;

    let animationFrame = 0;

    const updateImage = () => {
      animationFrame = 0;

      if (reduceMotion) {
        image.style.transform = 'translateY(0) scale(1.1)';
        return;
      }

      const bounds = section.getBoundingClientRect();
      const progress = clamp(
        (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)
      );
      const scale = 1.25 - progress * 0.25;
      const translateY = -6 + progress * 12;

      image.style.transform = [
        `translateY(${translateY.toFixed(3)}%)`,
        `scale(${scale.toFixed(4)})`
      ].join(' ');
    };

    const requestUpdate = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateImage);
      }
    };

    updateImage();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [reduceMotion]);

  return (
    <section
      ref={sectionRef}
      className={`alt-home-campaign${
        isVisible ? ' alt-home-campaign--visible' : ''
      }${reduceMotion ? ' alt-home-campaign--reduced' : ''}`}
      aria-labelledby="alt-home-campaign-title"
      data-alt-cursor-zone
    >
      <div className="alt-home-campaign__stage">
        <img
          ref={imageRef}
          className="alt-home-campaign__image"
          src={winterCampaignImage}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div className="alt-home-campaign__shade" aria-hidden="true" />

        <div className="alt-home-campaign__content">
          <p className="alt-home-campaign__eyebrow">
            The Winter Campaign
          </p>
          <h2 id="alt-home-campaign-title" className="alt-home-campaign__title">
            <span className="alt-home-campaign__line">
              <span>Worn slowly,</span>
            </span>
            <span className="alt-home-campaign__line">
              <span>kept for years</span>
            </span>
          </h2>
          <Link
            className="alt-home-campaign__cta"
            to="/products?category=fashion"
            data-alt-cursor="active"
            data-alt-cursor-label="View"
          >
            <span>View the campaign</span>
            <ArrowRight size={20} strokeWidth={1.2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};

const ShopLookHotspot = ({
  product,
  index,
  isActive,
  formatMoney,
  openHotspot,
  toggleHotspot,
  scheduleClose,
  cancelClose
}) => {
  if (!product) return null;

  const layout = LOOK_HOTSPOTS[index];
  const productUrl = `/products/${product.slug || product._id}`;
  const popoverId = `alt-home-look-product-${product._id}`;
  const primaryImage = product.images?.[0];
  const secondaryImage = product.images?.[1];

  return (
    <div
      className="alt-home-look__hotspot"
      style={{ left: layout.left, top: layout.top }}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        cancelClose();
        openHotspot(index);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') scheduleClose();
      }}
      onFocus={(event) => {
        if (event.currentTarget.matches(':focus-visible')) {
          openHotspot(index);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          scheduleClose();
        }
      }}
    >
      <button
        className="alt-home-look__hotspot-button"
        type="button"
        aria-label={`View ${product.name}`}
        aria-expanded={isActive}
        aria-controls={popoverId}
        onClick={() => toggleHotspot(index)}
        data-look-hotspot-trigger={index}
        data-alt-cursor="active"
        data-alt-cursor-label="Open"
      >
        <span className="alt-home-look__hotspot-pulse" aria-hidden="true" />
        <span className="alt-home-look__hotspot-minus" aria-hidden="true" />
        <span
          className="alt-home-look__hotspot-plus"
          aria-hidden="true"
        />
      </button>

      {isActive ? (
        <Link
          id={popoverId}
          className={`alt-home-look__popover alt-home-look__popover--${
            layout.popoverPosition
          }`}
          to={productUrl}
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') cancelClose();
          }}
          data-alt-cursor="active"
          data-alt-cursor-label="View"
        >
          <span className="alt-home-look__popover-media">
            <img
              src={primaryImage?.url
                ? mediaUrl(primaryImage.url)
                : consideredSilhouetteImage}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(event) => {
                const image = event.currentTarget;
                if (!image.dataset.lookFallback && secondaryImage?.url) {
                  image.dataset.lookFallback = 'alternate';
                  image.src = mediaUrl(secondaryImage.url);
                } else if (image.dataset.lookFallback !== 'editorial') {
                  image.dataset.lookFallback = 'editorial';
                  image.src = consideredSilhouetteImage;
                }
              }}
            />
          </span>
          <span className="alt-home-look__popover-copy">
            <strong>{product.name}</strong>
            <span>{formatMoney(product.price)}</span>
            <small>View →</small>
          </span>
        </Link>
      ) : null}
    </div>
  );
};

const ShopTheLookSection = ({ products, formatMoney }) => {
  const sectionRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [activeHotspot, setActiveHotspot] = useState(null);

  useEffect(() => () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (activeHotspot === null) return undefined;

    const handlePointerDown = (event) => {
      if (!event.target.closest?.('.alt-home-look__hotspot')) {
        setActiveHotspot(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        const trigger = sectionRef.current?.querySelector(
          `[data-look-hotspot-trigger="${activeHotspot}"]`
        );
        setActiveHotspot(null);
        window.requestAnimationFrame(() => trigger?.focus());
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeHotspot]);

  const cancelClose = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openHotspot = (index) => {
    cancelClose();
    setActiveHotspot(index);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      setActiveHotspot(null);
    }, 140);
  };

  const toggleHotspot = (index) => {
    cancelClose();
    setActiveHotspot((current) => (current === index ? null : index));
  };

  return (
    <section
      ref={sectionRef}
      className="alt-home-look"
      aria-labelledby="alt-home-look-title"
      data-alt-cursor-zone
    >
      <div className="alt-home-look__copy">
        <p className="alt-home-look__eyebrow">Styled by the Atelier</p>
        <h2 id="alt-home-look-title" className="alt-home-look__title">
          The Considered Silhouette
        </h2>
        <p className="alt-home-look__description">
          One coat, three quiet essentials — composed as a single confident
          look. Hover the pieces to shop the story.
        </p>
        <Link
          className="alt-home-look__cta"
          to="/products?category=fashion"
          data-alt-cursor="active"
          data-alt-cursor-label="Shop"
        >
          <span>Shop this look</span>
          <ArrowRight size={20} strokeWidth={1.2} aria-hidden="true" />
        </Link>
      </div>

      <div className="alt-home-look__media">
        <img
          className="alt-home-look__image"
          src={consideredSilhouetteImage}
          alt="A considered camel and cream winter silhouette"
          loading="lazy"
          decoding="async"
        />

        {products.slice(0, 3).map((product, index) => (
          <ShopLookHotspot
            product={product}
            index={index}
            isActive={activeHotspot === index}
            formatMoney={formatMoney}
            openHotspot={openHotspot}
            toggleHotspot={toggleHotspot}
            scheduleClose={scheduleClose}
            cancelClose={cancelClose}
            key={product._id}
          />
        ))}
      </div>
    </section>
  );
};

const ShopByCategorySection = () => {
  return (
    <section
      className="alt-home-categories"
      aria-labelledby="alt-home-categories-title"
      data-alt-cursor-zone
    >
      <div className="alt-home-categories__inner">
        <header className="alt-home-categories__header">
          <p className="alt-home-categories__eyebrow">Explore</p>
          <h2 id="alt-home-categories-title" className="alt-home-categories__title">
            Shop by Category
          </h2>
        </header>

        <div className="alt-home-categories__grid">
          {CATEGORY_ITEMS.map((category) => (
            <Link
              key={category.id}
              to={category.link}
              className="alt-home-categories__card"
              data-alt-cursor="active"
              data-alt-cursor-label="Shop"
            >
              <div className="alt-home-categories__media">
                <img
                  src={category.image}
                  alt={category.alt}
                  className="alt-home-categories__image"
                  loading="lazy"
                  decoding="async"
                />
                <div className="alt-home-categories__shade" aria-hidden="true" />
              </div>

              <div className="alt-home-categories__content">
                <h3 className="alt-home-categories__card-title">
                  {category.title}
                </h3>
                <span className="alt-home-categories__card-cta">
                  <span>{category.subtitle}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const MadeByHandSection = () => {
  return (
    <section
      className="alt-home-craft"
      aria-labelledby="alt-home-craft-title"
      data-alt-cursor-zone
    >
      <div className="alt-home-craft__inner">
        <div className="alt-home-craft__media">
          <img
            src={madeByHandAtelierImage}
            alt="Artisanal craftsmanship inside the atelier"
            className="alt-home-craft__image"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="alt-home-craft__content">
          <div className="alt-home-craft__eyebrow">
            <span className="alt-home-craft__line" aria-hidden="true" />
            <span>MADE BY HAND</span>
          </div>

          <h2 id="alt-home-craft-title" className="alt-home-craft__title">
            Every seam,<br />considered.
          </h2>

          <p className="alt-home-craft__description">
            Our pieces are cut and finished in small ateliers, by people
            who have spent a lifetime perfecting a single craft. Nothing
            is rushed. Nothing is wasted.
          </p>

          <Link
            to="/about"
            className="alt-home-craft__cta"
            data-alt-cursor="active"
            data-alt-cursor-label="Discover"
          >
            <span>INSIDE THE ATELIER</span>
            <ArrowRight size={16} strokeWidth={1.4} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};

const CuratedEditSection = ({ formatMoney }) => {
  return (
    <section
      className="alt-home-edit"
      aria-labelledby="alt-home-edit-title"
      data-alt-cursor-zone
    >
      <div className="alt-home-edit__inner">
        <header className="alt-home-edit__header">
          <div className="alt-home-edit__heading">
            <p className="alt-home-edit__eyebrow">Curated</p>
            <h2 id="alt-home-edit-title" className="alt-home-edit__title">
              The Edit
            </h2>
          </div>

          <Link
            to="/products"
            className="alt-home-edit__view-all"
            data-alt-cursor="active"
            data-alt-cursor-label="Browse"
          >
            <span>VIEW ALL</span>
            <ArrowRight size={15} strokeWidth={1.4} aria-hidden="true" />
          </Link>
        </header>

        <div className="alt-home-edit__grid">
          {EDIT_PRODUCTS.map((product) => (
            <div className="alt-home-edit__card" key={product.id}>
              <div className="alt-home-edit__media-wrap">
                {product.badge && (
                  <span className="alt-home-edit__badge">{product.badge}</span>
                )}

                <Link
                  to={product.link}
                  className="alt-home-edit__media-link"
                  data-alt-cursor="active"
                  data-alt-cursor-label="View"
                >
                  <img
                    src={product.image}
                    alt={product.alt}
                    className="alt-home-edit__image"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>

                <div className="alt-home-edit__actions">
                  <button
                    type="button"
                    className="alt-home-edit__action-btn"
                    aria-label="Quick view"
                  >
                    <Eye size={16} strokeWidth={1.4} />
                  </button>
                  <button
                    type="button"
                    className="alt-home-edit__action-btn"
                    aria-label="Add to wishlist"
                  >
                    <Heart size={16} strokeWidth={1.4} />
                  </button>
                </div>

                <Link
                  to={product.link}
                  className="alt-home-edit__add-btn"
                  data-alt-cursor="active"
                >
                  <span>ADD TO BAG</span>
                </Link>
              </div>

              <div className="alt-home-edit__info">
                <div className="alt-home-edit__meta">
                  <h3 className="alt-home-edit__product-title">
                    <Link to={product.link}>{product.title}</Link>
                  </h3>
                  <span className="alt-home-edit__color">{product.color}</span>
                </div>

                <div className="alt-home-edit__prices">
                  <span className="alt-home-edit__price">
                    {formatMoney ? formatMoney(product.price) : `$${product.price}`}
                  </span>
                  {product.originalPrice && (
                    <span className="alt-home-edit__original-price">
                      {formatMoney ? formatMoney(product.originalPrice) : `$${product.originalPrice}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};



const LookbookSection = ({ reduceMotion }) => {
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const progressRef = useRef(null);
  const maxScrollRef = useRef(0);
  const [useStaticCarousel, setUseStaticCarousel] = useState(() => (
    reduceMotion
    || (
      typeof window !== 'undefined'
      && window.matchMedia('(hover: none), (pointer: coarse)').matches
    )
  ));

  useEffect(() => {
    const pointerQuery = window.matchMedia(
      '(hover: none), (pointer: coarse)'
    );
    const syncMode = () => {
      setUseStaticCarousel(reduceMotion || pointerQuery.matches);
    };

    syncMode();
    pointerQuery.addEventListener?.('change', syncMode);
    return () => pointerQuery.removeEventListener?.('change', syncMode);
  }, [reduceMotion]);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!section || !track || !progress) return undefined;

    if (useStaticCarousel) {
      section.style.removeProperty('--alt-home-lookbook-scroll-height');
      track.style.transform = '';
      progress.style.width = '0%';
      maxScrollRef.current = 0;
      return undefined;
    }

    let animationFrame = 0;
    const settleTimers = [];

    const updatePosition = () => {
      animationFrame = 0;
      const maxScroll = maxScrollRef.current;
      const sectionTop = section.getBoundingClientRect().top;
      const offset = clamp(-sectionTop, 0, maxScroll);
      const completion = maxScroll > 0 ? offset / maxScroll : 0;

      track.style.transform = `translate3d(${-offset.toFixed(2)}px, 0, 0)`;
      progress.style.width = `${(completion * 100).toFixed(3)}%`;
    };

    const requestPositionUpdate = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updatePosition);
      }
    };

    const measure = () => {
      const maxScroll = Math.max(
        0,
        track.scrollWidth - window.innerWidth + window.innerWidth * 0.08
      );
      maxScrollRef.current = maxScroll;
      section.style.setProperty(
        '--alt-home-lookbook-scroll-height',
        `${window.innerHeight + maxScroll}px`
      );
      requestPositionUpdate();
    };

    const resizeObserver = 'ResizeObserver' in window
      ? new ResizeObserver(measure)
      : null;

    resizeObserver?.observe(track);
    window.addEventListener('scroll', requestPositionUpdate, { passive: true });
    window.addEventListener('resize', measure);
    settleTimers.push(window.setTimeout(measure, 400));
    settleTimers.push(window.setTimeout(measure, 1200));
    measure();

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', requestPositionUpdate);
      window.removeEventListener('resize', measure);
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [useStaticCarousel]);

  const handleKeyboardBrowse = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }

    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return;

    event.preventDefault();

    if (!useStaticCarousel) {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const maxScroll = maxScrollRef.current;
      const step = (
        track.querySelector('.alt-home-lookbook__card')?.getBoundingClientRect()
          .width || 320
      ) + 20;
      const target = event.key === 'Home'
        ? sectionTop
        : event.key === 'End'
          ? sectionTop + maxScroll
          : window.scrollY + (event.key === 'ArrowRight' ? step : -step);

      window.scrollTo({
        top: target,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
      return;
    }

    const cards = Array.from(
      track.querySelectorAll('.alt-home-lookbook__card')
    );
    if (!cards.length) return;

    const currentIndex = cards.reduce((nearest, card, index) => (
      Math.abs(card.offsetLeft - viewport.scrollLeft)
        < Math.abs(cards[nearest].offsetLeft - viewport.scrollLeft)
        ? index
        : nearest
    ), 0);
    const targetIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? cards.length - 1
        : clamp(
          currentIndex + (event.key === 'ArrowRight' ? 1 : -1),
          0,
          cards.length - 1
        );

    viewport.scrollTo({
      left: cards[targetIndex].offsetLeft,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  };

  return (
    <section
      ref={sectionRef}
      className={`alt-home-lookbook${
        useStaticCarousel ? ' alt-home-lookbook--static' : ''
      }`}
      aria-labelledby="alt-home-lookbook-title"
      data-alt-cursor-zone
    >
      <div className="alt-home-lookbook__stage">
        <header className="alt-home-lookbook__header">
          <div>
            <p className="alt-home-lookbook__eyebrow">
              Autumn — Winter 2026
            </p>
            <h2
              id="alt-home-lookbook-title"
              className="alt-home-lookbook__title"
            >
              The Lookbook
            </h2>
          </div>
          <p className="alt-home-lookbook__cue" aria-hidden="true">
            {useStaticCarousel ? 'Swipe' : 'Scroll'} →
          </p>
        </header>

        <p id="alt-home-lookbook-instructions" className="sr-only">
          {useStaticCarousel
            ? 'Swipe horizontally or use the left and right arrow keys to browse.'
            : 'Scroll vertically or use the left and right arrow keys to browse.'}
        </p>

        <div
          ref={viewportRef}
          className="alt-home-lookbook__viewport"
          role="region"
          tabIndex={0}
          aria-describedby="alt-home-lookbook-instructions"
          aria-label="Autumn Winter 2026 lookbook"
          onKeyDown={handleKeyboardBrowse}
        >
          <ul ref={trackRef} className="alt-home-lookbook__track">
            {LOOKBOOK_SLIDES.map((slide) => (
              <li className="alt-home-lookbook__card" key={slide.label}>
                <Link
                  className="alt-home-lookbook__card-link"
                  to="/products?category=fashion"
                  data-alt-cursor="active"
                  data-alt-cursor-label="Drag"
                >
                  <img
                    className="alt-home-lookbook__image"
                    src={slide.image}
                    alt={slide.alt}
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />
                  <span
                    className="alt-home-lookbook__shade"
                    aria-hidden="true"
                  />
                  <span className="alt-home-lookbook__caption">
                    <small>{slide.label}</small>
                    <strong>{slide.title}</strong>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="alt-home-lookbook__progress" aria-hidden="true">
          <span ref={progressRef} />
        </div>
      </div>
    </section>
  );
};

export const AltHomePage = () => {
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const pinnedRef = useRef(null);
  const newInRef = useRef(null);
  const newInCursorRef = useRef(null);
  const newInCursorDotRef = useRef(null);
  const newInCursorLabelRef = useRef(null);
  const liquidProgressRef = useRef(0);
  const eyebrowRef = useRef(null);
  const wordmarkRef = useRef(null);
  const copyRef = useRef(null);
  const scrollHintRef = useRef(null);
  const frameRefs = useRef([]);
  const letterRefs = useRef([]);
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 809px)').matches
      : false
  ));
  const [reduceMotion, setReduceMotion] = useState(() => (
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ));
  const [newInVisible, setNewInVisible] = useState(false);
  const { formatMoney } = useCurrency();

  const { data: newInProducts = [], isLoading: newInLoading } = useQuery({
    queryKey: ['alt-home-new-in-products'],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: { sort: 'newest', limit: 4 }
      });
      return data.data.products;
    },
    staleTime: 60 * 1000
  });

  const { data: lookProducts = [] } = useQuery({
    queryKey: ['alt-home-look-products'],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: { category: 'fashion', sort: 'newest', limit: 3 }
      });
      return data.data.products;
    },
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 809px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMediaPreferences = () => {
      setIsMobile(mobileQuery.matches);
      setReduceMotion(motionQuery.matches);
    };

    syncMediaPreferences();
    mobileQuery.addEventListener?.('change', syncMediaPreferences);
    motionQuery.addEventListener?.('change', syncMediaPreferences);

    return () => {
      mobileQuery.removeEventListener?.('change', syncMediaPreferences);
      motionQuery.removeEventListener?.('change', syncMediaPreferences);
    };
  }, []);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const pinned = pinnedRef.current;
    if (!track || !pinned) return undefined;

    let animationFrame = 0;
    const letters = Array.from(WORDMARK);

    const applyProgress = (progress) => {
      liquidProgressRef.current = progress;
      const frameCount = frameRefs.current.length;
      if (frameCount) {
        const frameProgress = progress * (frameCount - 1);
        const activeFrame = clamp(Math.floor(frameProgress), 0, frameCount - 1);
        const blend = easeInOutQuad(clamp(frameProgress - activeFrame));
        const scale = (isMobile ? 1.035 : 1.055)
          - (isMobile ? 0.023 : 0.037) * progress;

        frameRefs.current.forEach((frame, index) => {
          if (!frame) return;
          frame.style.opacity = String(
            index <= activeFrame ? 1 : index === activeFrame + 1 ? blend : 0
          );
          frame.style.transform = `scale(${scale.toFixed(4)})`;
        });
      }

      if (eyebrowRef.current) {
        eyebrowRef.current.style.opacity = String(
          1 - clamp((progress - 0.72) / 0.13)
        );
      }

      const letterStep = 0.36 / Math.max(1, letters.length);
      letterRefs.current.forEach((letter, index) => {
        if (!letter) return;
        const reveal = clamp(
          (progress - (0.05 + index * letterStep)) / 0.13
        );
        letter.style.opacity = String(reveal);
        letter.style.transform = `translateY(${(1 - reveal) * 100}%)`;
      });

      if (wordmarkRef.current) {
        const wordmarkProgress = clamp((progress - 0.42) / 0.4);
        wordmarkRef.current.style.transform = [
          `translateY(${-wordmarkProgress * 70}px)`,
          `scale(${1 - wordmarkProgress * 0.07})`
        ].join(' ');
        wordmarkRef.current.style.opacity = String(
          1 - wordmarkProgress * 0.15
        );
      }

      if (copyRef.current) {
        const copyProgress = clamp((progress - 0.5) / 0.22);
        copyRef.current.style.opacity = String(copyProgress);
        copyRef.current.style.transform = `translateY(${(1 - copyProgress) * 26}px)`;
        copyRef.current.style.pointerEvents = copyProgress > 0.8 ? 'auto' : 'none';
      }

      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity = String(
          1 - clamp(progress / 0.1)
        );
      }
    };

    const applyReducedMotionState = () => {
      liquidProgressRef.current = 1;
      frameRefs.current.forEach((frame, index) => {
        if (!frame) return;
        frame.style.opacity = String(index === frameRefs.current.length - 1 ? 1 : 0);
        frame.style.transform = 'scale(1.018)';
      });
      letterRefs.current.forEach((letter) => {
        if (!letter) return;
        letter.style.opacity = '1';
        letter.style.transform = 'translateY(0)';
      });
      if (eyebrowRef.current) eyebrowRef.current.style.opacity = '1';
      if (wordmarkRef.current) {
        wordmarkRef.current.style.opacity = '1';
        wordmarkRef.current.style.transform = 'none';
      }
      if (copyRef.current) {
        copyRef.current.style.opacity = '1';
        copyRef.current.style.transform = 'none';
        copyRef.current.style.pointerEvents = 'auto';
      }
      if (scrollHintRef.current) scrollHintRef.current.style.opacity = '0';
    };

    const update = () => {
      animationFrame = 0;
      const header = document.querySelector('.site-header');
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const visibleHeight = Math.max(1, window.innerHeight - headerHeight);

      pinned.style.height = `${visibleHeight}px`;
      pinned.style.minHeight = `${Math.min(620, visibleHeight)}px`;

      if (reduceMotion) {
        pinned.style.position = 'absolute';
        pinned.style.top = '0px';
        pinned.style.bottom = 'auto';
        applyReducedMotionState();
        return;
      }

      const trackRect = track.getBoundingClientRect();
      const travel = Math.max(1, track.offsetHeight - visibleHeight);
      const distanceFromPinStart = headerHeight - trackRect.top;
      let progress = 0;

      if (distanceFromPinStart <= 0) {
        pinned.style.position = 'absolute';
        pinned.style.top = '0px';
        pinned.style.bottom = 'auto';
      } else if (distanceFromPinStart <= travel) {
        pinned.style.position = 'fixed';
        pinned.style.top = `${headerHeight}px`;
        pinned.style.bottom = 'auto';
        progress = distanceFromPinStart / travel;
      } else {
        pinned.style.position = 'absolute';
        pinned.style.top = 'auto';
        pinned.style.bottom = '0px';
        progress = 1;
      }

      applyProgress(clamp(progress));
    };

    const requestUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [isMobile, reduceMotion]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduceMotion) return undefined;

    let wheelAnimationFrame = 0;
    let wheelTarget = window.scrollY;
    let previousFrameTime = 0;

    const cancelWheelMomentum = () => {
      if (wheelAnimationFrame) {
        window.cancelAnimationFrame(wheelAnimationFrame);
        wheelAnimationFrame = 0;
      }
      wheelTarget = window.scrollY;
      previousFrameTime = 0;
    };

    const animateWheelMomentum = (time) => {
      const elapsed = previousFrameTime
        ? Math.min(32, time - previousFrameTime)
        : 16.67;
      previousFrameTime = time;

      const currentScroll = window.scrollY;
      const distance = wheelTarget - currentScroll;

      if (Math.abs(distance) < 0.5) {
        window.scrollTo({ top: wheelTarget, left: 0, behavior: 'instant' });
        wheelAnimationFrame = 0;
        previousFrameTime = 0;
        return;
      }

      const damping = 1 - Math.exp(-14 * (elapsed / 1000));
      window.scrollTo({
        top: currentScroll + distance * damping,
        left: 0,
        behavior: 'instant'
      });
      wheelAnimationFrame = window.requestAnimationFrame(animateWheelMomentum);
    };

    const isDiscreteMouseWheel = (event) => {
      const pixelDelta = Math.abs(event.deltaY);
      const legacyDelta = Math.abs(event.wheelDeltaY ?? 0);
      const usesWheelSteps = legacyDelta >= 120
        && Math.abs(legacyDelta % 120) < 0.01;
      const usesLargePixelSteps = legacyDelta === 0
        && Number.isInteger(event.deltaY)
        && pixelDelta >= 80;

      return event.deltaMode !== 0 || usesWheelSteps || usesLargePixelSteps;
    };

    const onWheel = (event) => {
      if (
        event.defaultPrevented
        || event.ctrlKey
        || event.metaKey
        || event.shiftKey
        || event.deltaY === 0
      ) {
        return;
      }

      if (!isDiscreteMouseWheel(event)) {
        cancelWheelMomentum();
        return;
      }

      const headerHeight = document
        .querySelector('.site-header')
        ?.getBoundingClientRect().height ?? 0;
      const trackRect = track.getBoundingClientRect();
      const heroIsVisible = trackRect.bottom > headerHeight
        && trackRect.top < window.innerHeight;

      if (!heroIsVisible) {
        cancelWheelMomentum();
        return;
      }

      event.preventDefault();

      const modeMultiplier = event.deltaMode === 1
        ? 18
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;
      const pixelDelta = event.deltaY * modeMultiplier;
      const boundedDelta = Math.sign(pixelDelta) * Math.min(
        Math.abs(pixelDelta) * 1.15,
        window.innerHeight * 0.8
      );
      const maximumScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );

      if (!wheelAnimationFrame) wheelTarget = window.scrollY;
      wheelTarget = clamp(wheelTarget + boundedDelta, 0, maximumScroll);

      if (!wheelAnimationFrame) {
        wheelAnimationFrame = window.requestAnimationFrame(animateWheelMomentum);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', cancelWheelMomentum, { passive: true });
    window.addEventListener('pointerdown', cancelWheelMomentum, { passive: true });
    window.addEventListener('keydown', cancelWheelMomentum);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', cancelWheelMomentum);
      window.removeEventListener('pointerdown', cancelWheelMomentum);
      window.removeEventListener('keydown', cancelWheelMomentum);
      cancelWheelMomentum();
    };
  }, [reduceMotion]);

  useEffect(() => {
    const section = newInRef.current;
    if (!section) return undefined;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      setNewInVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNewInVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -8% 0px'
      }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const cursor = newInCursorRef.current;
    const dot = newInCursorDotRef.current;
    const label = newInCursorLabelRef.current;
    const cursorZones = wrapper
      ? Array.from(wrapper.querySelectorAll('[data-alt-cursor-zone]'))
      : [];
    const finePointer = window.matchMedia(
      '(hover: hover) and (pointer: fine)'
    ).matches;

    if (
      !cursorZones.length
      || !cursor
      || !dot
      || !label
      || !finePointer
      || reduceMotion
    ) {
      return undefined;
    }

    let animationFrame = 0;
    let isInside = false;
    const target = { x: -100, y: -100, scale: 1 };
    const cursorPosition = { x: -100, y: -100, scale: 1 };
    const dotPosition = { x: -100, y: -100 };

    const renderCursor = () => {
      cursorPosition.x += (target.x - cursorPosition.x) * 0.15;
      cursorPosition.y += (target.y - cursorPosition.y) * 0.15;
      cursorPosition.scale += (target.scale - cursorPosition.scale) * 0.18;
      dotPosition.x += (target.x - dotPosition.x) * 0.5;
      dotPosition.y += (target.y - dotPosition.y) * 0.5;

      cursor.style.transform = [
        `translate3d(${cursorPosition.x}px, ${cursorPosition.y}px, 0)`,
        'translate(-50%, -50%)',
        `scale(${cursorPosition.scale})`
      ].join(' ');
      dot.style.transform = [
        `translate3d(${dotPosition.x}px, ${dotPosition.y}px, 0)`,
        'translate(-50%, -50%)'
      ].join(' ');

      animationFrame = isInside
        ? window.requestAnimationFrame(renderCursor)
        : 0;
    };

    const updateCursorState = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;

      const interactiveTarget = event.target.closest?.(
        '[data-alt-cursor="active"]'
      );
      const isActive = Boolean(interactiveTarget);
      target.scale = isActive ? 2.4 : 1;
      label.textContent = interactiveTarget?.dataset.altCursorLabel || '';
      cursor.classList.toggle('alt-home-new-in__cursor--active', isActive);
    };

    const onPointerEnter = (event) => {
      isInside = true;
      event.currentTarget.classList.add('alt-home-cursor-engaged');
      target.x = event.clientX;
      target.y = event.clientY;
      cursorPosition.x = target.x;
      cursorPosition.y = target.y;
      dotPosition.x = target.x;
      dotPosition.y = target.y;
      cursor.classList.add('alt-home-new-in__cursor--visible');
      dot.classList.add('alt-home-new-in__cursor-dot--visible');
      updateCursorState(event);
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(renderCursor);
      }
    };

    const onPointerMove = (event) => {
      if (!isInside) onPointerEnter(event);
      updateCursorState(event);
    };

    const onPointerLeave = (event) => {
      isInside = false;
      event.currentTarget.classList.remove('alt-home-cursor-engaged');
      target.scale = 1;
      label.textContent = '';
      cursor.classList.remove(
        'alt-home-new-in__cursor--visible',
        'alt-home-new-in__cursor--active'
      );
      dot.classList.remove('alt-home-new-in__cursor-dot--visible');
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };

    cursorZones.forEach((zone) => {
      zone.addEventListener('pointerenter', onPointerEnter);
      zone.addEventListener('pointermove', onPointerMove);
      zone.addEventListener('pointerleave', onPointerLeave);
    });

    return () => {
      cursorZones.forEach((zone) => {
        zone.removeEventListener('pointerenter', onPointerEnter);
        zone.removeEventListener('pointermove', onPointerMove);
        zone.removeEventListener('pointerleave', onPointerLeave);
        zone.classList.remove('alt-home-cursor-engaged');
      });
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [reduceMotion]);

  return (
    <div ref={wrapperRef} className="alt-home-wrapper">
      <Seo
        title="lahVenture — Autumn / Winter"
        description="A quieter luxury, made to last a lifetime."
      />

      {HERO_FRAMES.map((frame) => (
        <link key={frame} rel="preload" as="image" href={frame} />
      ))}

      <section
        ref={trackRef}
        className={`alt-home-hero${reduceMotion ? ' alt-home-hero--reduced' : ''}`}
        aria-labelledby="alt-home-wordmark"
      >
        <div
          ref={pinnedRef}
          className="alt-home-hero__viewport"
          style={{
            backgroundImage: `url(${heroOpeningFrame})`,
            backgroundPosition: isMobile ? '38% 8%' : '50% 10%',
            backgroundSize: 'cover'
          }}
        >
          <div
            className="alt-home-hero__frames"
            aria-hidden="true"
          >
            {HERO_FRAMES.map((frame, index) => (
              <img
                key={frame}
                ref={(node) => {
                  frameRefs.current[index] = node;
                }}
                className="alt-home-hero__frame"
                src={frame}
                alt=""
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'auto'}
                style={{
                  objectPosition: isMobile
                    ? `${index === 2 ? 50 : 38}% ${index === 2 ? 45 : 8}%`
                    : `50% ${index === 2 ? 42 : 10}%`
                }}
              />
            ))}
            <LiquidHoverCanvas
              images={HERO_FRAMES}
              progressRef={liquidProgressRef}
              focalPoints={
                isMobile ? MOBILE_FOCAL_POINTS : DESKTOP_FOCAL_POINTS
              }
              disabled={reduceMotion}
              mobile={isMobile}
              resolution={4}
              cursorSize={0.5}
              cursorPower={1}
              distortionPower={0.8}
            />
          </div>

          <div className="alt-home-hero__vignette" aria-hidden="true" />

          <div className="alt-home-hero__content">
            <p ref={eyebrowRef} className="alt-home-hero__eyebrow">
              Autumn — Winter 2026
            </p>

            <div ref={wordmarkRef} className="alt-home-hero__wordmark-wrap">
              <h1
                id="alt-home-wordmark"
                className="alt-home-hero__wordmark"
                aria-label="LAHVENTURE"
              >
                {Array.from(WORDMARK).map((letter, index) => (
                  <span
                    className="alt-home-hero__letter-clip"
                    aria-hidden="true"
                    key={`${letter}-${index}`}
                  >
                    <span
                      ref={(node) => {
                        letterRefs.current[index] = node;
                      }}
                      className="alt-home-hero__letter"
                    >
                      {letter}
                    </span>
                  </span>
                ))}
              </h1>
            </div>

            <div ref={copyRef} className="alt-home-hero__copy">
              <p>A quieter luxury, made to last a lifetime.</p>
              <Link
                className="alt-home-hero__cta"
                to="/products"
              >
                <span className="alt-home-hero__cta-sweep" aria-hidden="true" />
                <span>Discover the collection</span>
                <ArrowRight size={22} strokeWidth={1.25} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div
            ref={scrollHintRef}
            className="alt-home-hero__scroll-hint"
            aria-hidden="true"
          >
            <span>Scroll</span>
            <i />
          </div>
        </div>
      </section>

      <section
        ref={newInRef}
        className={`alt-home-new-in${
          newInVisible ? ' alt-home-new-in--visible' : ''
        }${reduceMotion ? ' alt-home-new-in--reduced' : ''}`}
        aria-labelledby="alt-home-new-in-title"
        data-alt-cursor-zone
      >
        <div className="alt-home-new-in__inner">
          <div className="alt-home-new-in__header">
            <div className="alt-home-new-in__heading">
              <p className="alt-home-new-in__eyebrow">Just Arrived</p>
              <h2 id="alt-home-new-in-title" className="alt-home-new-in__title">
                <span>New</span>{' '}
                <span>In</span>
              </h2>
            </div>

            <Link
              className="alt-home-new-in__view-all"
              to="/products?sort=newest"
            >
              <span>View all</span>
              <ArrowRight size={17} strokeWidth={1.4} aria-hidden="true" />
            </Link>
          </div>

          <div
            className="alt-home-new-in__grid"
            aria-busy={newInLoading}
          >
            {newInLoading
              ? [0, 1, 2, 3].map((index) => (
                <div className="alt-home-new-in__card-stage" key={index}>
                  <div
                    className="alt-home-new-in__card alt-home-new-in__card--skeleton"
                    aria-hidden="true"
                  >
                    <div className="alt-home-new-in__skeleton-media" />
                    <div className="alt-home-new-in__skeleton-copy">
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
              ))
              : newInProducts.map((product, index) => (
                <NewInProductCard
                  product={product}
                  index={index}
                  formatMoney={formatMoney}
                  key={product._id}
                />
              ))}
          </div>
        </div>

      </section>

      <CampaignStorySection reduceMotion={reduceMotion} />

      <ShopTheLookSection
        products={lookProducts}
        formatMoney={formatMoney}
      />

      <ShopByCategorySection />

      <MadeByHandSection />

      <CuratedEditSection formatMoney={formatMoney} />

      <LookbookSection reduceMotion={reduceMotion} />



      <div className="alt-home-marquee" aria-label="Explore our collections">
        <div className="alt-home-marquee__track">
          {[0, 1].map((copyIndex) => (
            <div
              className="alt-home-marquee__set"
              aria-hidden={copyIndex === 1}
              key={copyIndex}
            >
              {MARQUEE_ITEMS.map((item) => (
                <span key={`${copyIndex}-${item}`}>
                  <Link to="/products">{item}</Link>
                  <i>✦</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="alt-home-new-in__cursor-layer" aria-hidden="true">
        <div ref={newInCursorRef} className="alt-home-new-in__cursor">
          <span ref={newInCursorLabelRef} />
        </div>
        <div ref={newInCursorDotRef} className="alt-home-new-in__cursor-dot" />
      </div>
    </div>
  );
};
