import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';

export const ProductCard = ({ product, onChanged }) => {
  const { user, refreshUser } = useAuth();
  const { addItem } = useCart();
  const { formatMoney } = useCurrency();
  const navigate = useNavigate();
  const productUrl = `/products/${product.slug || product._id}`;
  const hasOptions = (product.variants || []).some((variant) => variant.name && variant.options?.length);

  const handleCart = async () => {
    if (hasOptions) return navigate(productUrl);
    if (!user) return navigate('/login');
    await addItem(product._id, 1);
    refreshUser?.();
    return onChanged?.('Added to cart');
  };

  const handleWishlist = async () => {
    if (!user) return navigate('/login');
    try {
      await api.post(`/users/wishlist/${product._id}`);
      refreshUser?.();
      onChanged?.('Wishlist updated');
    } catch (error) {
      onChanged?.(apiErrorMessage(error));
    }
  };

  const isWishlisted = user?.wishlist?.some(
    (item) => (typeof item === 'string' ? item : item?._id) === product._id
  );

  return (
    <article className="product-card">
      <div className="product-card__content-box">
        <div className="product-card__media">
          <Link to={productUrl}>
            <img src={mediaUrl(product.images?.[0]?.url)} alt={product.images?.[0]?.alt || product.name} />
          </Link>
          <button type="button" className="product-card__wishlist" onClick={handleWishlist} aria-label="Wishlist">
            <Heart size={20} fill={isWishlisted ? '#66000c' : 'none'} color="#66000c" />
          </button>
          {product.compareAtPrice ? <span className="badge sale">Sale</span> : null}
        </div>
        <div className="product-card__info-row">
          <Link to={productUrl} className="product-card__title">
            {product.name}
          </Link>
          <span className="product-card__price">
            {formatMoney(product.price)}
          </span>
        </div>
      </div>
      <button type="button" className="product-card__add-to-cart" onClick={handleCart}>
        {hasOptions ? 'Choose options' : 'Add to cart'}
      </button>
    </article>
  );
};
