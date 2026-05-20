import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { money } from '../utils/format.js';

export const ProductCard = ({ product, onChanged }) => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleCart = async () => {
    if (!user) return navigate('/login');
    await addItem(product._id, 1);
    return onChanged?.('Added to cart');
  };

  const handleWishlist = async () => {
    if (!user) return navigate('/login');
    try {
      await api.post(`/users/wishlist/${product._id}`);
      onChanged?.('Wishlist updated');
    } catch (error) {
      onChanged?.(apiErrorMessage(error));
    }
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug || product._id}`} className="product-card__media">
        <img src={mediaUrl(product.images?.[0]?.url)} alt={product.images?.[0]?.alt || product.name} />
        {product.compareAtPrice ? <span className="badge sale">Sale</span> : null}
      </Link>
      <div className="product-card__body">
        <div>
          <p className="eyebrow">{product.brand || product.category?.name}</p>
          <Link to={`/products/${product.slug || product._id}`} className="product-card__title">
            {product.name}
          </Link>
        </div>
        <div className="rating-row" aria-label={`${product.ratingsAverage || 0} stars`}>
          <Star size={15} fill="currentColor" />
          <span>{product.ratingsAverage?.toFixed?.(1) || '0.0'}</span>
          <span className="muted">({product.ratingsCount || 0})</span>
        </div>
        <div className="product-card__footer">
          <div>
            <strong>{money(product.price)}</strong>
            {product.compareAtPrice ? <span>{money(product.compareAtPrice)}</span> : null}
          </div>
          <div className="icon-actions">
            <button type="button" className="icon-button" onClick={handleWishlist} aria-label="Wishlist">
              <Heart size={18} />
            </button>
            <button type="button" className="icon-button dark" onClick={handleCart} aria-label="Add to cart">
              <ShoppingBag size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
