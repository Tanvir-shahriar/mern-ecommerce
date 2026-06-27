import {
  CreditCard,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Award,
  Settings,
  Circle,
  Maximize2,
  Palette,
  Layers,
  Paintbrush,
  Sparkles,
  CircleDot,
  Link2,
  Droplets,
  Tag
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { ProductRatingsAndReviews } from '../components/ProductRatingsAndReviews.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { dateShort, money } from '../utils/format.js';
import { directCheckoutUrl, startDirectCheckout } from '../utils/directCheckout.js';

const ReviewStars = ({ rating = 0 }) => (
  <div className="review-stars" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star size={15} fill="currentColor" key={star} className={star <= rating ? 'filled' : ''} />
    ))}
  </div>
);

export const ProductDetailPage = () => {
  const { slugOrId } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [similarActionId, setSimilarActionId] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('specifications');
  const { user, isAdmin, refreshUser } = useAuth();

  useEffect(() => {
    setActiveImageIndex(0);
  }, [slugOrId]);

  const { addItem } = useCart();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const { data: product, isLoading, isError, refetch } = useQuery({
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

  const addToCart = async () => {
    if (!user) return navigate('/login');
    try {
      await addItem(product._id, quantity);
      setMessage('Added to cart');
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  const purchaseNow = async () => {
    startDirectCheckout({ productId: product._id, quantity });
    if (!user) return navigate('/login', { state: { from: { pathname: '/checkout', search: '?mode=buy-now' } } });
    return navigate(directCheckoutUrl);
  };

  const addSimilarToCart = async (item) => {
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
  const stockStatusText = product.inventory?.trackQuantity ? `${product.inventory.stock} in stock` : 'Ready to ship';

  const isWishlisted = user?.wishlist?.some(
    (item) => (typeof item === 'string' ? item : item?._id) === product._id
  );

  const getSpecs = (prod) => {
    const nameLower = (prod.name || '').toLowerCase();
    const isSmart = nameLower.includes('smart') || nameLower.includes('pulse') || nameLower.includes('apex');
    const isGold = nameLower.includes('gold') || nameLower.includes('rose');
    const attributes = new Map(
      (prod.attributes || []).map((item) => [String(item.name || '').toLowerCase(), item.value])
    );
    const specValue = (label, fallback) => attributes.get(label.toLowerCase()) || fallback;
    
    return [
      {
        icon: <Tag size={16} />,
        label: 'Product code',
        value: `SKU: ${prod.sku || 'CR4007ZA RG BL LT'}`
      },
      {
        icon: <Award size={16} />,
        label: 'Family',
        value: prod.brand || 'lahVenture'
      },
      {
        icon: <Settings size={16} />,
        label: 'Movement',
        value: specValue('Movement', isSmart ? 'SMART / QUARTZ' : 'AUTOMATIC')
      },
      {
        icon: <Circle size={16} />,
        label: 'Case Metal',
        value: specValue('Case Metal', isGold ? 'Rose Gold / Steel' : 'Stainless Steel')
      },
      {
        icon: <Maximize2 size={16} />,
        label: 'Case Size',
        value: specValue('Case Size', isSmart ? '44 mm' : '42 mm')
      },
      {
        icon: <Palette size={16} />,
        label: 'Case Color',
        value: specValue('Case Color', isGold ? 'Rose Gold' : 'Stainless Steel')
      },
      {
        icon: <Layers size={16} />,
        label: 'Bracelet Material',
        value: specValue('Bracelet Material', nameLower.includes('strap') || nameLower.includes('leather') ? 'Leather' : isSmart ? 'Silicone' : 'Stainless Steel')
      },
      {
        icon: <Paintbrush size={16} />,
        label: 'Bracelet Color',
        value: specValue('Bracelet Color', nameLower.includes('black') ? 'Black' : nameLower.includes('brown') || nameLower.includes('leather') ? 'Leather' : 'Stainless Steel')
      },
      {
        icon: <Sparkles size={16} />,
        label: 'Glass',
        value: specValue('Glass', isSmart ? 'Gorilla Glass' : 'Sapphire')
      },
      {
        icon: <CircleDot size={16} />,
        label: 'Dial Color',
        value: specValue('Dial Color', nameLower.includes('white') ? 'White' : nameLower.includes('blue') ? 'Blue' : 'Black')
      },
      {
        icon: <Link2 size={16} />,
        label: 'Buckle',
        value: specValue('Buckle', isSmart ? 'Pin Buckle' : 'Butterfly Buckle with Double push')
      },
      {
        icon: <Droplets size={16} />,
        label: 'WR',
        value: specValue('WR', isSmart ? 'IP68' : '5 ATM')
      }
    ];
  };

  return (
    <section className="product-detail">
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
        <div className="product-specs-list">
          <p className="spec-item"><strong>Model:</strong> {product.sku || 'CR4007ZA RG BL LT'}</p>
          <p className="spec-item"><strong>Barcode:</strong> {parseInt(product._id.slice(-6), 16) || '7037306'}</p>
          <p className="spec-item"><strong>Gender:</strong> {product.gender || (product.tags?.includes('women') ? 'FEMALE' : 'MALE')}</p>
          <p className="spec-item"><strong>Bracelet:</strong> {product.name.toLowerCase().includes('strap') || product.name.toLowerCase().includes('leather') ? 'LEATHER' : 'STAINLESS STEEL'}</p>
          <p className="spec-item">
            <strong>In Stock:</strong> <span className={inStock ? 'status-available' : 'status-unavailable'}>{inStock ? 'AVAILABLE' : 'OUT OF STOCK'}</span>
          </p>
          <p className="spec-price-row">
            <strong>Price:</strong> <span className="spec-price-val">{money(product.price)}</span>
          </p>
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

              return (
                <article className="similar-product-card" key={item._id}>
                  <Link className="similar-product-media" to={itemTo}>
                    <img src={mediaUrl(item.images?.[0]?.url)} alt={item.images?.[0]?.alt || item.name} />
                  </Link>
                  <div className="similar-product-body">
                    <p className="eyebrow">{item.brand || item.category?.name || 'lahVenture'}</p>
                    <Link className="similar-product-title" to={itemTo}>
                      {item.name}
                    </Link>
                    <p className="similar-product-description">
                      {item.shortDescription || item.description}
                    </p>
                    <div className="similar-product-meta">
                      <div>
                        <strong>{money(item.price)}</strong>
                        {item.compareAtPrice ? <span>{money(item.compareAtPrice)}</span> : null}
                      </div>
                    </div>
                    <div className="similar-product-actions">
                      <button
                        className="button primary compact similar-cart-button"
                        type="button"
                        onClick={() => addSimilarToCart(item)}
                        disabled={!itemInStock || isAddingSimilar}
                        aria-label={`Add ${item.name} to cart`}
                        title="Add to cart"
                      >
                        {isAddingSimilar ? <span className="spinner tiny" /> : <ShoppingBag size={16} />}
                      </button>
                      <button
                        className="button purchase-now-button compact similar-purchase-button"
                        type="button"
                        onClick={() => purchaseSimilarNow(item)}
                        disabled={!itemInStock}
                      >
                        <CreditCard size={16} />
                        Purchase now
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
