import { CreditCard, Heart, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
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
  const { user, isAdmin } = useAuth();
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

  return (
    <section className="product-detail">
      <div className="product-gallery">
        <img src={mediaUrl(product.images?.[0]?.url)} alt={product.images?.[0]?.alt || product.name} />
      </div>
      <div className="product-info">
        <Link className="eyebrow" to={`/products?category=${product.category?.slug || ''}`}>
          {product.category?.name || product.brand}
        </Link>
        <h1>{product.name}</h1>
        <div className="rating-row">
          <Star size={17} fill="currentColor" />
          <strong>{product.ratingsAverage?.toFixed?.(1) || '0.0'}</strong>
          <span className="muted">{product.ratingsCount || 0} reviews</span>
        </div>
        <p className="lead">{product.shortDescription || product.description}</p>
        <div className="price-stack">
          <strong>{money(product.price)}</strong>
          {product.compareAtPrice ? <span>{money(product.compareAtPrice)}</span> : null}
        </div>
        {isAdmin || !inStock ? (
          <p className={inStock ? 'stock ok' : 'stock empty'}>{inStock ? stockStatusText : 'Out of stock'}</p>
        ) : null}

        <div className="purchase-row">
          <div className="stepper">
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">
              <Minus size={16} />
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity">
              <Plus size={16} />
            </button>
          </div>
          <button className="button primary" type="button" onClick={addToCart} disabled={!inStock}>
            <ShoppingBag size={18} />
            Add to cart
          </button>
          <button className="button purchase-now-button" type="button" onClick={purchaseNow} disabled={!inStock}>
            <CreditCard size={18} />
            Purchase now
          </button>
          <button className="icon-button" type="button" onClick={toggleWishlist} aria-label="Wishlist">
            <Heart size={19} />
          </button>
        </div>
        {message ? <p className="form-note">{message}</p> : null}

        <div className="detail-block">
          <h2>Details</h2>
          <p>{product.description}</p>
        </div>
      </div>

      <section className="reviews-section" id="reviews">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2>Customer notes</h2>
          </div>
          <span className="review-count">{product.ratingsCount || 0} verified review(s)</span>
        </div>
        <div className="review-list">
          {product.reviews?.length ? (
            product.reviews.map((item) => (
              <article className="review-item" key={item._id}>
                <div className="review-item-header">
                  <div>
                    <h3>{item.name}</h3>
                    {item.createdAt ? <span>{dateShort(item.createdAt)}</span> : null}
                  </div>
                  <ReviewStars rating={item.rating} />
                </div>
                <p>{item.comment}</p>
                <span className="verified-review">Verified purchase</span>
              </article>
            ))
          ) : (
            <p className="muted">No reviews yet.</p>
          )}
        </div>
      </section>

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
