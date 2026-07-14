import {
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Award,
  Layers,
  Tag
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { ProductRatingsAndReviews } from '../components/ProductRatingsAndReviews.jsx';
import { Seo } from '../components/Seo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { directCheckoutUrl, startDirectCheckout } from '../utils/directCheckout.js';

const productTypeLabels = {
  physical: 'Physical product',
  digital: 'Digital product',
  service: 'Service',
  subscription: 'Subscription',
  gift_card: 'Gift card',
  other: 'Other'
};

export const ProductDetailPage = () => {
  const { slugOrId } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [similarActionId, setSimilarActionId] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('specifications');
  const [selectedVariant, setSelectedVariant] = useState({});
  const { user } = useAuth();
  const { formatMoney } = useCurrency();

  useEffect(() => {
    setActiveImageIndex(0);
  }, [slugOrId]);

  const { addItem } = useCart();
  const navigate = useNavigate();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slugOrId],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slugOrId}`);
      return data.data.product;
    }
  });

  const { data: similarProducts = [] } = useQuery({
    queryKey: ['similar-products', product?._id],
    enabled: Boolean(product?._id),
    queryFn: async () => {
      const { data } = await api.get(`/products/${product._id}/similar`, { params: { limit: 4 } });
      return data.data.products;
    }
  });

  useEffect(() => {
    if (!product?._id) return;

    const defaults = {};
    (product.variants || []).forEach((variant) => {
      const firstOption = (variant.options || []).find(Boolean);
      if (variant.name && firstOption) defaults[variant.name] = firstOption;
    });
    setSelectedVariant(defaults);
  }, [product?._id]);

  const selectedVariantPayload = () => {
    const entries = Object.entries(selectedVariant).filter(([, value]) => value);
    return entries.length ? Object.fromEntries(entries) : undefined;
  };

  const addToCart = async () => {
    if (!user) return navigate('/login');
    try {
      await addItem(product._id, quantity, selectedVariantPayload());
      setMessage('Added to cart');
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  const purchaseNow = async () => {
    startDirectCheckout({ productId: product._id, quantity, variant: selectedVariantPayload() });
    if (!user) return navigate('/login', { state: { from: { pathname: '/checkout', search: '?mode=buy-now' } } });
    return navigate(directCheckoutUrl);
  };

  const addSimilarToCart = async (item) => {
    if ((item.variants || []).some((variant) => variant.name && variant.options?.length)) {
      return navigate(`/products/${item.slug || item._id}`);
    }
    if (!user) return navigate('/login');
    setSimilarActionId(`cart-${item._id}`);
    try {
      await addItem(item._id, 1);
      setMessage(`${item.name} added to cart`);
    } catch (error) {
      setMessage(apiErrorMessage(error));
    } finally {
      setSimilarActionId('');
    }
  };

  const purchaseSimilarNow = (item) => {
    if ((item.variants || []).some((variant) => variant.name && variant.options?.length)) {
      return navigate(`/products/${item.slug || item._id}`);
    }
    startDirectCheckout({ productId: item._id, quantity: 1 });
    if (!user) return navigate('/login', { state: { from: { pathname: '/checkout', search: '?mode=buy-now' } } });
    return navigate(directCheckoutUrl);
  };

  const toggleWishlist = async () => {
    if (!user) return navigate('/login');
    await api.post(`/users/wishlist/${product._id}`);
    setMessage('Wishlist updated');
  };

  if (isLoading) return <LoadingScreen />;
  if (isError || !product) return <EmptyState title="Product not found" actionLabel="Back to catalog" actionTo="/products" />;

  const inStock = !product.inventory?.trackQuantity || product.inventory.stock > 0;
  const isWishlisted = user?.wishlist?.some(
    (item) => (typeof item === 'string' ? item : item?._id) === product._id
  );

  const getSpecs = (prod) => [
    {
      icon: <Tag size={16} />,
      label: 'SKU',
      value: prod.sku
    },
    {
      icon: <Tag size={16} />,
      label: 'Barcode',
      value: prod.barcode
    },
    {
      icon: <Award size={16} />,
      label: 'Brand',
      value: prod.brand
    },
    {
      icon: <Layers size={16} />,
      label: 'Category',
      value: prod.category?.name
    },
    {
      icon: <Layers size={16} />,
      label: 'Product type',
      value: productTypeLabels[prod.productType] || productTypeLabels.physical
    },
    {
      icon: <Award size={16} />,
      label: 'Vendor',
      value: prod.vendor
    },
    ...(prod.attributes || []).map((attribute) => ({
      icon: <Tag size={16} />,
      label: attribute.name,
      value: attribute.value
    }))
  ].filter((spec) => spec.label && spec.value);

  const mainImageUrl = mediaUrl(product.images?.[0]?.url);
  const brandName = product.brand || 'LahVenture';
  const variantGroups = (product.variants || []).filter(
    (variant) => variant.name && Array.isArray(variant.options) && variant.options.length
  );

  const productSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${window.location.origin}/products/${product.slug || product._id}#product`,
        'name': product.name,
        'image': [mainImageUrl],
        'description': product.description || `Buy ${product.name} at LahVenture Bangladesh.`,
        'sku': product.sku || product.name,
        'brand': {
          '@type': 'Brand',
          'name': brandName
        },
        'offers': {
          '@type': 'Offer',
          'url': window.location.href,
          'priceCurrency': 'BDT',
          'price': product.price,
          'priceValidUntil': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'itemCondition': 'https://schema.org/NewCondition',
          'availability': inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          'seller': {
            '@type': 'Organization',
            'name': 'LahVenture'
          }
        },
        ...(product.ratingsAverage > 0 && product.ratingsCount > 0
          ? {
              'aggregateRating': {
                '@type': 'AggregateRating',
                'ratingValue': product.ratingsAverage,
                'reviewCount': product.ratingsCount
              }
            }
          : {})
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': window.location.origin
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Products',
            'item': `${window.location.origin}/products`
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': product.name,
            'item': window.location.href
          }
        ]
      }
    ]
  };

  return (
    <section className="product-detail">
      <Seo
        title={product.seo?.title || `${product.name} - Price in Bangladesh`}
        description={product.seo?.description || `Buy authentic ${product.name} at the best price in Bangladesh. Order original ${brandName} watch with cash on delivery and brand warranty from LahVenture.`}
        ogImage={mainImageUrl}
        ogType="product"
        schemaJson={productSchema}
      />
      <div className="product-detail-left">
        <div className="product-gallery-container">
          <div className="product-gallery__main-frame">
            <div className="product-gallery__image-box">
              <img src={mediaUrl(product.images?.[activeImageIndex]?.url || product.images?.[0]?.url)} alt={product.name} />
              <div className="product-gallery__dots">
                {(product.images || []).map((_, idx) => (
                  <span key={idx} className={`dot ${idx === activeImageIndex ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </div>
          {product.images && product.images.length > 1 && (
            <div className="product-gallery__thumbnails">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`thumbnail-btn ${idx === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img src={mediaUrl(img.url)} alt={`Thumbnail ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="product-detail-right">
        <div className="product-info">
          <span className="product-brand-badge">{brandName}</span>
          <h1>{product.name}</h1>
        </div>

        <div className="product-specs-list">
          <p className="spec-item"><strong>SKU:</strong> {product.sku || 'Not set'}</p>
          {product.barcode ? <p className="spec-item"><strong>Barcode:</strong> {product.barcode}</p> : null}
          {product.category?.name ? <p className="spec-item"><strong>Category:</strong> {product.category.name}</p> : null}
          <p className="spec-item"><strong>Type:</strong> {productTypeLabels[product.productType] || productTypeLabels.physical}</p>
          <p className="spec-item">
            <strong>In Stock:</strong> <span className={inStock ? 'status-available' : 'status-unavailable'}>{inStock ? 'AVAILABLE' : 'OUT OF STOCK'}</span>
          </p>
          <p className="spec-price-row">
            <strong>Price:</strong> <span className="spec-price-val">{formatMoney(product.price)}</span>
          </p>
        </div>

        {variantGroups.length ? (
          <div className="product-option-groups" aria-label="Product options">
            {variantGroups.map((variant) => (
              <label key={variant.name} className="product-option-group">
                {variant.name}
                <select
                  value={selectedVariant[variant.name] || variant.options[0] || ''}
                  onChange={(event) =>
                    setSelectedVariant((current) => ({
                      ...current,
                      [variant.name]: event.target.value
                    }))
                  }
                >
                  {variant.options.map((option) => (
                    <option value={option} key={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}

        <div className="product-purchase-controls">
          <span>Quantity</span>
          <div className="product-quantity-stepper">
            <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Decrease quantity">
              <Minus size={15} />
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              aria-label="Quantity"
            />
            <button type="button" onClick={() => setQuantity((current) => current + 1)} aria-label="Increase quantity">
              <Plus size={15} />
            </button>
          </div>
        </div>

        <div className="product-actions-row">
          <button className="button-buy-now" type="button" onClick={purchaseNow} disabled={!inStock}>
            <Star size={16} fill="white" color="white" />
            Buy Now
          </button>
          <button className="button-add-to-cart" type="button" onClick={addToCart} disabled={!inStock}>
            <ShoppingBag size={16} color="white" />
            Add To Cart
          </button>
          <button className="button-wishlist" type="button" onClick={toggleWishlist} aria-label="Wishlist">
            <Heart size={16} fill={isWishlisted ? '#66000c' : 'none'} color="#66000c" />
          </button>
        </div>
        
        {message ? <p className="form-note">{message}</p> : null}

        <div className="product-tabs-container">
          <div className="product-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('specifications')}
            >
              Specifications
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'descriptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('descriptions')}
            >
              Descriptions
            </button>
          </div>
          <div className="tab-content">
            {activeTab === 'specifications' ? (
              <table className="specs-table">
                <tbody>
                  {getSpecs(product).map((spec, index) => (
                    <tr key={index}>
                      <td className="spec-icon-col">{spec.icon}</td>
                      <td className="spec-label-col">{spec.label}</td>
                      <td className="spec-value-col">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="tab-description-text">{product.description}</p>
            )}
          </div>
        </div>
      </div>

      <ProductRatingsAndReviews product={product} />

      {similarProducts.length ? (
        <section className="similar-section">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Recommended</p>
              <h2>Similar products</h2>
            </div>
          </div>
          <div className="similar-product-grid">
            {similarProducts.map((item) => {
              const itemTo = `/products/${item.slug || item._id}`;
              const itemInStock = !item.inventory?.trackQuantity || item.inventory.stock > 0;
              const isAddingSimilar = similarActionId === `cart-${item._id}`;
              const itemHasOptions = (item.variants || []).some((variant) => variant.name && variant.options?.length);

              const isItemWishlisted = user?.wishlist?.some(
                (w) => (typeof w === 'string' ? w : w?._id) === item._id
              );

              const toggleSimilarWishlist = async () => {
                if (!user) return navigate('/login');
                await api.post(`/users/wishlist/${item._id}`);
                setMessage('Wishlist updated');
              };

              return (
                <article className="product-card" key={item._id}>
                  <div className="product-card__content-box">
                    <div className="product-card__media">
                      <Link to={itemTo}>
                        <img src={mediaUrl(item.images?.[0]?.url)} alt={item.images?.[0]?.alt || item.name} />
                      </Link>
                      {item.compareAtPrice ? <span className="badge sale">Sale</span> : null}
                    </div>
                    <div className="product-card__info-row">
                      <Link to={itemTo} className="product-card__title">
                        {item.name}
                      </Link>
                      <span className="product-card__price">
                        {formatMoney(item.price)}
                      </span>
                    </div>
                    <div className="similar-actions-row">
                      <button className="button-buy-now" type="button" onClick={() => purchaseSimilarNow(item)} disabled={!itemInStock}>
                        <Star size={15} fill="white" color="white" />
                        Buy Now
                      </button>
                      <button className="button-add-to-cart" type="button" onClick={() => addSimilarToCart(item)} disabled={!itemInStock || isAddingSimilar}>
                        {isAddingSimilar ? <span className="spinner tiny" /> : <ShoppingBag size={15} color="white" />}
                        {itemHasOptions ? 'Choose Options' : 'Add To Cart'}
                      </button>
                      <button className="button-wishlist" type="button" onClick={toggleSimilarWishlist} aria-label="Wishlist">
                        <Heart size={18} fill={isItemWishlisted ? '#66000c' : 'none'} color="#66000c" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
};
