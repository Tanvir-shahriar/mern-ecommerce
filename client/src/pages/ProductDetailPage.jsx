import { Heart, Minus, Plus, ShoppingBag, Star, Zap } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { money } from '../utils/format.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { directCheckoutUrl, startDirectCheckout } from '../utils/directCheckout.js';

export const ProductDetailPage = () => {
  const { slugOrId } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' });
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const toggleWishlist = async () => {
    if (!user) return navigate('/login');
    await api.post(`/users/wishlist/${product._id}`);
    setMessage('Wishlist updated');
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!user) return navigate('/login');

    try {
      await api.post(`/products/${product._id}/reviews`, review);
      setReview({ rating: 5, title: '', comment: '' });
      setMessage('Review posted');
      queryClient.invalidateQueries({ queryKey: ['product', slugOrId] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (isError || !product) return <EmptyState title="Product not found" actionLabel="Back to catalog" actionTo="/products" />;

  const inStock = !product.inventory?.trackQuantity || product.inventory.stock > 0;

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
        <p className={inStock ? 'stock ok' : 'stock empty'}>{inStock ? `${product.inventory.stock} in stock` : 'Out of stock'}</p>

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
          <button className="button dark" type="button" onClick={purchaseNow} disabled={!inStock}>
            <Zap size={18} />
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

      <section className="reviews-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2>Customer notes</h2>
          </div>
        </div>
        <div className="reviews-layout">
          <div className="review-list">
            {product.reviews?.length ? (
              product.reviews.map((item) => (
                <article className="review-item" key={item._id}>
                  <div className="rating-row">
                    <Star size={15} fill="currentColor" />
                    <strong>{item.rating}</strong>
                  </div>
                  <h3>{item.title || item.name}</h3>
                  <p>{item.comment}</p>
                </article>
              ))
            ) : (
              <p className="muted">No reviews yet.</p>
            )}
          </div>
          <form className="form-panel" onSubmit={submitReview}>
            <h3>Write a review</h3>
            <label>
              Rating
              <select value={review.rating} onChange={(event) => setReview((value) => ({ ...value, rating: Number(event.target.value) }))}>
                {[5, 4, 3, 2, 1].map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input value={review.title} onChange={(event) => setReview((value) => ({ ...value, title: event.target.value }))} />
            </label>
            <label>
              Comment
              <textarea required value={review.comment} onChange={(event) => setReview((value) => ({ ...value, comment: event.target.value }))} />
            </label>
            <button className="button dark" type="submit">
              Post review
            </button>
          </form>
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
          <div className="product-grid">
            {similarProducts.map((item) => (
              <ProductCard product={item} key={item._id} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
};
