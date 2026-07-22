import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  Mouse,
  Search,
  ShoppingBag,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Seo } from '../components/Seo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import editorialHero from '../assets/collections/editorial-hero.jpg';
import lahventureLogo from '../assets/images/Lahventure Logo.png';
import lahventureMark from '../assets/images/Lahventure fav.png';
import modelOne from '../assets/garments/m-1.png';
import modelTwo from '../assets/garments/m-2.png';
import modelThree from '../assets/garments/m-3.png';
import modelFour from '../assets/garments/m-4.png';
import modelFive from '../assets/garments/m-5.png';
import modelSix from '../assets/garments/m-6.png';
import modelSeven from '../assets/garments/m-7.png';

const OPEN_SEQUENCE_MS = 2120;
const CLOSE_SEQUENCE_MS = 760;
const GALLERY_SEQUENCE_MS = 330;

const fallbackModelImages = [
  { url: modelOne, alt: 'Model wearing a black Boston graphic T-shirt' },
  { url: modelTwo, alt: 'Model wearing a black typographic T-shirt' },
  { url: modelThree, alt: 'Model wearing an oxblood relaxed-fit T-shirt' },
  { url: modelFour, alt: 'Model wearing a black varsity graphic T-shirt' },
  { url: modelFive, alt: 'Model wearing a charcoal oversized hoodie' },
  { url: modelSix, alt: 'Model wearing a crimson oversized hoodie' },
  { url: modelSeven, alt: 'Model wearing a slate-blue oversized hoodie' }
];

const fallbackProductCopy = [
  ['Boston Relaxed Fit T-Shirt', 'LV-TS-001', 4200, 'Heavyweight cotton jersey cut with a relaxed shoulder and a clean, architectural drape.'],
  ['Undici Gothic T-Shirt', 'LV-TS-002', 4600, 'A minimal black jersey with a compact typographic mark and a soft, oversized silhouette.'],
  ['Archive Oxblood T-Shirt', 'LV-TS-003', 4400, 'Washed oxblood cotton with a boxy proportion, wide sleeve and subtle archive detailing.'],
  ['Varsity 07 T-Shirt', 'LV-TS-004', 4800, 'A bold varsity graphic balanced by an easy unisex cut and premium combed cotton.'],
  ['Eclipse Two-Tone Hoodie', 'LV-HD-005', 7600, 'Dense brushed fleece with a sculpted double hood, deep cuff and generous everyday volume.'],
  ['Crimson Script Hoodie', 'LV-HD-006', 7200, 'A rich crimson fleece hoodie with dropped shoulders and restrained tonal embroidery.'],
  ['BlueTech Oversized Hoodie', 'LV-HD-007', 7400, 'A cool slate hoodie with a structured hood, soft brushed interior and relaxed technical shape.']
];

const fallbackProducts = fallbackProductCopy.map(([name, sku, price, description], index) => ({
  _id: `editorial-placeholder-${index + 1}`,
  id: `editorial-placeholder-${index + 1}`,
  name,
  sku,
  price,
  description,
  brand: 'LahVenture',
  material: index < 4 ? '100% heavyweight cotton' : 'Premium brushed fleece',
  isEditorialPlaceholder: true,
  category: { name: 'Clothing', slug: 'clothing-mens' },
  images: Array.from({ length: 5 }, (_, imageIndex) => (
    fallbackModelImages[(index + imageIndex) % fallbackModelImages.length]
  ))
}));

const fallbackCollections = [
  {
    categoryKey: 'fashion',
    title: 'FASHION COLLECTION',
    kicker: 'SPRING / SUMMER 2026',
    stampText: 'LAHVENTURE COLLECTION • MADE FOR EVERYDAY MOVEMENT',
    tagline: 'A study in relaxed proportions, precise detail and practical daily luxury.',
    bannerImage: {
      url: editorialHero,
      alt: 'Editorial model in a black coat with a crimson lapel'
    },
    products: fallbackProducts
  }
];

const defaultStockBannerIds = [
  'photo-1490481651871',
  'photo-1505740420928',
  'photo-1513694203232',
  'photo-1522337360788',
  'photo-1509631179647'
];

const productIdentity = (product) => product?._id || product?.id || product?.slug || product?.sku || product?.name;

const editorialProductFillers = (products = [], collectionIndex = 0) => {
  const availableProducts = products.filter(Boolean);
  if (availableProducts.length >= 7) return availableProducts;

  const missingCount = 7 - availableProducts.length;
  const fillers = fallbackProducts.slice(0, missingCount).map((product, productIndex) => ({
    ...product,
    _id: `${product._id}-${collectionIndex}-${productIndex}`,
    id: `${product.id}-${collectionIndex}-${productIndex}`
  }));

  return [...availableProducts, ...fillers];
};

const collectionHeroSource = (collection) => {
  const source = collection?.bannerImage?.url || '';
  const isDefaultFashionImage = collection?.categoryKey === 'fashion'
    && defaultStockBannerIds.some((identifier) => source.includes(identifier));

  return isDefaultFashionImage || !source ? editorialHero : mediaUrl(source);
};

const collectionHeading = (collection) => {
  const kicker = String(collection?.kicker || 'SEASONAL').trim();
  const year = kicker.match(/\b20\d{2}\b/)?.[0];

  if (year) {
    return {
      firstLine: kicker.replace(year, '').replace(/[-–—]\s*$/, '').trim(),
      secondLine: `${year} COLLECTION`
    };
  }

  return {
    firstLine: kicker,
    secondLine: collection?.title || 'COLLECTION'
  };
};

const productUrl = (product) => `/products/${product?.slug || product?._id || product?.id}`;

const categoryUrl = (collection, product) => {
  const category = product?.category;
  const value = category?.slug || category?.name || collection?.categoryKey;
  return value ? `/products?category=${encodeURIComponent(value)}` : '/products';
};

const SocialFacebookIcon = ({ size = 14 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
  </svg>
);

const SocialInstagramIcon = ({ size = 14 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
  </svg>
);

const SocialXIcon = ({ size = 15 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
  </svg>
);

const EditorialLogo = ({ dark = false }) => (
  <span className={`editorial-collections__logo${dark ? ' is-dark' : ''}`}>
    <img src={lahventureLogo} alt="LahVenture" />
    <span>Signature edit</span>
  </span>
);

const SocialLinks = ({ dark = false }) => (
  <div className={`editorial-collections__socials${dark ? ' is-dark' : ''}`} aria-label="Social media">
    <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
      <SocialFacebookIcon />
    </a>
    <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
      <SocialInstagramIcon />
    </a>
    <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
      <SocialXIcon size={13} />
    </a>
  </div>
);

const StampBadge = ({ text }) => {
  const generatedId = useId();
  const pathId = `editorial-stamp-${generatedId.replace(/:/g, '')}`;

  return (
    <div className="editorial-collections__stamp" aria-hidden="true">
      <svg viewBox="0 0 160 160">
        <defs>
          <path id={pathId} d="M80,80 m-61,0 a61,61 0 1,1 122,0 a61,61 0 1,1 -122,0" />
        </defs>
        <text>
          <textPath href={`#${pathId}`} startOffset="0%">
            {`${text || 'LAHVENTURE COLLECTION'} • `}
          </textPath>
        </text>
      </svg>
      <img src={lahventureMark} alt="" />
    </div>
  );
};

const ProductRail = ({ products, onOpenProduct, onNudge, railViewportRef }) => (
  <div className="editorial-collections__rail-area">
    <div className="editorial-collections__rail-viewport" ref={railViewportRef}>
      <div className="editorial-collections__rail-motion">
        <div className="editorial-collections__rail-group">
          {products.map((product, productIndex) => (
            <button
              type="button"
              className="editorial-collections__product-card"
              key={`${productIdentity(product)}-${productIndex}`}
              onClick={(event) => onOpenProduct(product, event.currentTarget)}
              aria-label={`Open ${product.name}`}
            >
              <img
                src={mediaUrl(product.images?.[0]?.url)}
                alt={product.images?.[0]?.alt || product.name}
                loading={productIndex < 5 ? 'eager' : 'lazy'}
                decoding="async"
                onError={(event) => {
                  if (event.currentTarget.dataset.fallbackApplied) return;
                  event.currentTarget.dataset.fallbackApplied = 'true';
                  event.currentTarget.src = fallbackModelImages[productIndex % fallbackModelImages.length].url;
                }}
              />
              <span aria-hidden="true"><ArrowRight size={14} /></span>
            </button>
          ))}
        </div>
      </div>
    </div>

    <div className="editorial-collections__rail-controls">
      <div>
        <button type="button" onClick={() => onNudge(-1)} aria-label="Previous products">
          <ChevronLeft size={17} />
        </button>
        <button type="button" onClick={() => onNudge(1)} aria-label="Next products">
          <ChevronRight size={17} />
        </button>
      </div>
      <span aria-hidden="true"><i /></span>
    </div>
  </div>
);

export const BrandsPage = () => {
  const navigate = useNavigate();
  const { addItem, itemCount } = useCart();
  const { user, refreshUser } = useAuth();

  const [activeCollectionIndex, setActiveCollectionIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailPhase, setDetailPhase] = useState('idle');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previousImageIndex, setPreviousImageIndex] = useState(null);
  const [imageDirection, setImageDirection] = useState(1);
  const [gallerySequence, setGallerySequence] = useState(0);
  const [wishlistSaved, setWishlistSaved] = useState(false);
  const [detailMessage, setDetailMessage] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const detailRef = useRef(null);
  const closeButtonRef = useRef(null);
  const menuRef = useRef(null);
  const menuCloseButtonRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const triggerRef = useRef(null);
  const railViewportRef = useRef(null);
  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const focusTimerRef = useRef(null);
  const galleryTimerRef = useRef(null);

  const { data: brandPageData } = useQuery({
    queryKey: ['brand-page-public'],
    queryFn: async () => {
      const { data } = await api.get('/brand-page');
      return data.data;
    },
    staleTime: 60 * 1000,
    retry: 1
  });

  const collections = useMemo(() => {
    const configuredCollections = brandPageData?.collections?.filter((collection) => collection.isActive !== false) || [];
    if (!configuredCollections.length) return fallbackCollections;

    return configuredCollections.map((collection, collectionIndex) => ({
      ...collection,
      products: editorialProductFillers(collection.products, collectionIndex)
    }));
  }, [brandPageData]);

  useEffect(() => {
    if (activeCollectionIndex > collections.length - 1) setActiveCollectionIndex(0);
  }, [activeCollectionIndex, collections.length]);

  useEffect(() => {
    railViewportRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [activeCollectionIndex]);

  const activeCollection = collections[activeCollectionIndex] || fallbackCollections[0];
  const heading = collectionHeading(activeCollection);
  const products = activeCollection.products?.length ? activeCollection.products.slice(0, 9) : fallbackProducts;
  const selectedImages = useMemo(() => {
    const images = selectedProduct?.images?.filter((image) => image?.url) || [];
    if (images.length >= 5) return images.slice(0, 5);

    const supplementaryImages = fallbackModelImages.filter((candidate) => (
      !images.some((image) => image.url === candidate.url)
    ));

    return [...images, ...supplementaryImages].slice(0, 5);
  }, [selectedProduct]);

  const isSelectedProductWishlisted = useCallback((product) => user?.wishlist?.some((item) => {
    const wishlistId = typeof item === 'string' ? item : item?._id;
    return wishlistId === product?._id;
  }), [user]);

  const openMenu = useCallback((trigger) => {
    menuTriggerRef.current = trigger || document.activeElement;
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => menuTriggerRef.current?.focus?.({ preventScroll: true }));
  }, []);

  const closeDetail = useCallback(() => {
    if (!selectedProduct || detailPhase === 'closing') return;

    window.clearTimeout(openTimerRef.current);
    window.clearTimeout(focusTimerRef.current);
    setMenuOpen(false);
    setDetailPhase('closing');

    closeTimerRef.current = window.setTimeout(() => {
      setSelectedProduct(null);
      setDetailPhase('idle');
      setPreviousImageIndex(null);
      setDetailMessage('');
      railViewportRef.current?.scrollTo({ left: 0, behavior: 'auto' });
      triggerRef.current?.focus?.({ preventScroll: true });
    }, CLOSE_SEQUENCE_MS);
  }, [detailPhase, selectedProduct]);

  const openProduct = useCallback((product, trigger) => {
    window.clearTimeout(closeTimerRef.current);
    window.clearTimeout(openTimerRef.current);
    window.clearTimeout(focusTimerRef.current);
    window.clearTimeout(galleryTimerRef.current);

    triggerRef.current = trigger || document.activeElement;
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setPreviousImageIndex(null);
    setGallerySequence(0);
    setImageDirection(1);
    setWishlistSaved(Boolean(isSelectedProductWishlisted(product)));
    setDetailMessage('');
    setDetailPhase('opening');

    openTimerRef.current = window.setTimeout(() => setDetailPhase('open'), OPEN_SEQUENCE_MS);
    focusTimerRef.current = window.setTimeout(() => closeButtonRef.current?.focus({ preventScroll: true }), 820);
  }, [isSelectedProductWishlisted]);

  const selectDetailImage = useCallback((nextIndex) => {
    if (nextIndex === activeImageIndex || nextIndex < 0 || nextIndex >= selectedImages.length) return;

    window.clearTimeout(galleryTimerRef.current);
    setPreviousImageIndex(activeImageIndex);
    setImageDirection(nextIndex > activeImageIndex ? 1 : -1);
    setActiveImageIndex(nextIndex);
    setGallerySequence((sequence) => sequence + 1);

    galleryTimerRef.current = window.setTimeout(() => {
      setPreviousImageIndex(null);
    }, GALLERY_SEQUENCE_MS);
  }, [activeImageIndex, selectedImages.length]);

  useEffect(() => {
    document.body.classList.add('collections-immersive-active');
    return () => document.body.classList.remove('collections-immersive-active');
  }, []);

  useEffect(() => () => {
    window.clearTimeout(openTimerRef.current);
    window.clearTimeout(closeTimerRef.current);
    window.clearTimeout(focusTimerRef.current);
    window.clearTimeout(galleryTimerRef.current);
  }, []);

  useEffect(() => {
    if (!selectedProduct) return undefined;

    const onKeyDown = (event) => {
      if (menuOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeDetail();
        return;
      }

      if (event.key === 'ArrowLeft' && selectedImages.length > 1) {
        event.preventDefault();
        selectDetailImage((activeImageIndex - 1 + selectedImages.length) % selectedImages.length);
        return;
      }

      if (event.key === 'ArrowRight' && selectedImages.length > 1) {
        event.preventDefault();
        selectDetailImage((activeImageIndex + 1) % selectedImages.length);
        return;
      }

      if (event.key !== 'Tab' || !detailRef.current) return;
      const focusable = [...detailRef.current.querySelectorAll('a[href], button:not([disabled])')]
        .filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeImageIndex, closeDetail, menuOpen, selectDetailImage, selectedImages.length, selectedProduct]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    menuCloseButtonRef.current?.focus({ preventScroll: true });

    const onMenuKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
        return;
      }

      if (event.key !== 'Tab' || !menuRef.current) return;
      const focusable = [...menuRef.current.querySelectorAll('a[href], button:not([disabled])')]
        .filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onMenuKeyDown);
    return () => document.removeEventListener('keydown', onMenuKeyDown);
  }, [closeMenu, menuOpen]);

  useEffect(() => {
    if (!selectedProduct || selectedProduct.isEditorialPlaceholder) return;
    setWishlistSaved(Boolean(isSelectedProductWishlisted(selectedProduct)));
  }, [isSelectedProductWishlisted, selectedProduct]);

  const nudgeRail = (direction) => {
    const viewport = railViewportRef.current;
    const firstCard = viewport?.querySelector('.editorial-collections__product-card');
    if (!viewport || !firstCard) return;

    const group = firstCard.parentElement;
    const gap = Number.parseFloat(window.getComputedStyle(group).columnGap || '0');
    const step = firstCard.getBoundingClientRect().width + gap;
    const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    let target = viewport.scrollLeft + direction * step;

    if (target > maximum - 2) target = 0;
    if (target < 0) target = maximum;
    viewport.scrollTo({ left: target, behavior: 'smooth' });
  };

  const handleShopNow = async () => {
    if (!selectedProduct) return;

    if (selectedProduct.isEditorialPlaceholder) {
      navigate('/products');
      return;
    }

    const hasOptions = selectedProduct.variants?.some((variant) => variant.name && variant.options?.length);
    if (hasOptions) {
      navigate(productUrl(selectedProduct));
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    setDetailMessage('');
    try {
      await addItem(selectedProduct._id || selectedProduct.id, 1);
      refreshUser?.();
      navigate('/cart');
    } catch (error) {
      setDetailMessage(apiErrorMessage(error));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!selectedProduct) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (selectedProduct.isEditorialPlaceholder) {
      setWishlistSaved((saved) => !saved);
      return;
    }

    setDetailMessage('');
    try {
      const { data } = await api.post(`/users/wishlist/${selectedProduct._id}`);
      await refreshUser?.();
      setWishlistSaved(Boolean(data?.data?.added));
    } catch (error) {
      setDetailMessage(apiErrorMessage(error));
    }
  };

  const detailAttributeLines = useMemo(() => {
    if (!selectedProduct) return [];
    const productAttributes = (selectedProduct.attributes || [])
      .map((attribute) => {
        const value = Array.isArray(attribute.value) ? attribute.value.join(', ') : attribute.value;
        return value ? `${attribute.name}: ${value}` : '';
      })
      .filter(Boolean)
      .slice(0, 3);

    if (productAttributes.length) return productAttributes;
    return [
      selectedProduct.material || 'Premium everyday construction',
      selectedProduct.brand ? `By ${selectedProduct.brand}` : 'LahVenture editorial selection',
      'Curated in Dhaka, Bangladesh'
    ];
  }, [selectedProduct]);

  const schema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${heading.firstLine} ${heading.secondLine}`,
    description: activeCollection.tagline,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.filter((product) => !product.isEditorialPlaceholder).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${window.location.origin}${productUrl(product)}`
      }))
    }
  }), [activeCollection.tagline, heading.firstLine, heading.secondLine, products]);

  return (
    <section className={`editorial-collections${selectedProduct ? ' has-detail-open' : ''}`} aria-label="Collections">
      <Seo
        title="Collections | LahVenture"
        description="Explore LahVenture collections through an immersive editorial product experience."
        schemaJson={schema}
      />

      <div className={`editorial-collections__showcase${detailPhase === 'closing' ? ' is-returning' : ''}`}>
        <img
          className="editorial-collections__hero-image"
          src={collectionHeroSource(activeCollection)}
          alt={activeCollection.bannerImage?.alt || activeCollection.title}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onError={(event) => {
            if (event.currentTarget.src.endsWith(editorialHero)) return;
            event.currentTarget.src = editorialHero;
          }}
        />
        <div className="editorial-collections__hero-shade" aria-hidden="true" />

        <header className="editorial-collections__header">
          <Link to="/" aria-label="LahVenture home"><EditorialLogo /></Link>
          <div className="editorial-collections__header-actions">
            <button type="button" onClick={() => navigate('/products')} aria-label="Search products">
              <Search size={18} strokeWidth={1.7} />
            </button>
            <button type="button" className="editorial-collections__bag-button" onClick={() => navigate('/cart')} aria-label="Shopping bag">
              <ShoppingBag size={18} strokeWidth={1.7} />
              {itemCount ? <span>{itemCount}</span> : null}
            </button>
            <button type="button" onClick={(event) => openMenu(event.currentTarget)} aria-label="Open menu">
              <Menu size={19} strokeWidth={1.7} />
            </button>
          </div>
        </header>

        <aside className="editorial-collections__hero-rail" aria-label="Collection social links">
          <SocialLinks />
          <span>Contact us</span>
          <Mouse size={18} strokeWidth={1.4} aria-hidden="true" />
        </aside>

        <StampBadge text={activeCollection.stampText} />

        <div className="editorial-collections__headline" key={activeCollection.categoryKey}>
          <p>{heading.firstLine}</p>
          <h1>{heading.secondLine}</h1>
        </div>

        <ProductRail
          products={products}
          onOpenProduct={openProduct}
          onNudge={nudgeRail}
          railViewportRef={railViewportRef}
        />

        <Link className="editorial-collections__visit-link" to={categoryUrl(activeCollection, products[0])}>
          Visit the Collection <ArrowRight size={14} />
        </Link>

        {collections.length > 1 ? (
          <div className="editorial-collections__collection-count" aria-label="Current collection">
            <span>{String(activeCollectionIndex + 1).padStart(2, '0')}</span>
            <i />
            <span>{String(collections.length).padStart(2, '0')}</span>
          </div>
        ) : null}
      </div>

      {selectedProduct ? (
        <div
          ref={detailRef}
          className={`editorial-detail editorial-detail--${detailPhase}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="editorial-detail-title"
        >
          <aside className="editorial-detail__rail">
            <Link to="/" aria-label="LahVenture home"><EditorialLogo dark /></Link>

            <div className="editorial-detail__rail-copy">
              <strong>“{selectedProduct.name}”</strong>
              <span>{selectedProduct.sku || 'CURATED EDITION'}</span>
              <div>
                {detailAttributeLines.map((line) => <small key={line}>{line}</small>)}
              </div>
              <b>{selectedProduct.material || selectedProduct.brand || 'LahVenture'}</b>
            </div>

            <SocialLinks dark />
            <span className="editorial-detail__contact-label">Contact us</span>
            <Mouse className="editorial-detail__mouse" size={18} strokeWidth={1.4} aria-hidden="true" />
          </aside>

          <div className={`editorial-detail__gallery direction-${imageDirection > 0 ? 'forward' : 'backward'}`}>
            {previousImageIndex !== null ? (
              <img
                className="editorial-detail__model-image is-exiting"
                src={mediaUrl(selectedImages[previousImageIndex]?.url)}
                alt=""
                aria-hidden="true"
              />
            ) : null}
            <img
              key={`${productIdentity(selectedProduct)}-${activeImageIndex}-${gallerySequence}`}
              className={`editorial-detail__model-image${previousImageIndex !== null ? ' is-entering' : ''}`}
              src={mediaUrl(selectedImages[activeImageIndex]?.url)}
              alt={selectedImages[activeImageIndex]?.alt || selectedProduct.name}
              loading="eager"
              decoding="async"
              onError={(event) => {
                if (event.currentTarget.dataset.fallbackApplied) return;
                event.currentTarget.dataset.fallbackApplied = 'true';
                event.currentTarget.src = fallbackModelImages[activeImageIndex % fallbackModelImages.length].url;
              }}
            />
            <span className="editorial-detail__gallery-index" aria-hidden="true">
              {String(activeImageIndex + 1).padStart(2, '0')} / {String(selectedImages.length).padStart(2, '0')}
            </span>
          </div>

          <section className="editorial-detail__content">
            <header className="editorial-detail__topbar">
              <button
                ref={closeButtonRef}
                type="button"
                className="editorial-detail__close"
                onClick={closeDetail}
                aria-label="Close product details"
              >
                <X size={17} strokeWidth={1.8} />
              </button>

              <Link to={categoryUrl(activeCollection, selectedProduct)}>
                Visit the Collection <ArrowRight size={12} />
              </Link>

              <div>
                <button type="button" onClick={() => navigate('/products')} aria-label="Search products">
                  <Search size={17} strokeWidth={1.6} />
                </button>
                <button type="button" onClick={() => navigate('/cart')} aria-label="Shopping bag">
                  <ShoppingBag size={17} strokeWidth={1.6} />
                </button>
                <button type="button" onClick={(event) => openMenu(event.currentTarget)} aria-label="Open menu">
                  <Menu size={18} strokeWidth={1.6} />
                </button>
              </div>
            </header>

            <div className="editorial-detail__copy">
              <p>{(selectedProduct.brand || 'LahVenture').toUpperCase()} — CURATED COLLECTION EDIT</p>
              <h2 id="editorial-detail-title">“{selectedProduct.name}”</h2>
              <span>{selectedProduct.sku || 'LIMITED EDITION'}</span>
              <p>{selectedProduct.description || activeCollection.tagline}</p>
              <div className="editorial-detail__actions">
                <button type="button" onClick={handleShopNow} disabled={addingToCart}>
                  {addingToCart ? 'ADDING…' : selectedProduct.isEditorialPlaceholder ? 'SHOP COLLECTION' : 'SHOP NOW'}
                  <ArrowRight size={16} />
                </button>
                <button type="button" onClick={handleWishlist} aria-pressed={wishlistSaved}>
                  <Heart size={16} fill={wishlistSaved ? 'currentColor' : 'none'} />
                  {wishlistSaved ? 'Saved to Wish List' : 'Add to Wish List'}
                </button>
              </div>

              <p className="editorial-detail__message" aria-live="polite">{detailMessage}</p>
            </div>

            <div className="editorial-detail__thumbnails" aria-label="Product images">
              {selectedImages.map((image, index) => (
                <button
                  type="button"
                  key={`${image.url}-${index}`}
                  className={index === activeImageIndex ? 'is-active' : ''}
                  onClick={() => selectDetailImage(index)}
                  aria-label={`Show image ${index + 1} of ${selectedImages.length}`}
                  aria-pressed={index === activeImageIndex}
                >
                  <img src={mediaUrl(image.url)} alt="" loading="eager" decoding="async" />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="editorial-menu-layer">
          <button type="button" className="editorial-menu-layer__scrim" onClick={closeMenu} aria-label="Close menu" />
          <aside ref={menuRef} className="editorial-menu" role="dialog" aria-modal="true" aria-label="Site menu">
            <div>
              <EditorialLogo dark />
              <button ref={menuCloseButtonRef} type="button" onClick={closeMenu} aria-label="Close menu"><X size={20} /></button>
            </div>
            <nav>
              <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link to="/products" onClick={() => setMenuOpen(false)}>Shop</Link>
              <Link to="/collections" onClick={() => setMenuOpen(false)}>Collections</Link>
              <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
              <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
            </nav>
            {collections.length > 1 ? (
              <div className="editorial-menu__collections">
                <p>Collection stories</p>
                {collections.map((collection, index) => (
                  <button
                    type="button"
                    className={index === activeCollectionIndex ? 'is-active' : ''}
                    key={collection.categoryKey || collection.title}
                    onClick={() => {
                      setActiveCollectionIndex(index);
                      setMenuOpen(false);
                    }}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {collection.title}
                  </button>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </section>
  );
};
