import { useState } from 'react';
import { ArrowRight, Clock3, Heart, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { Seo } from '../components/Seo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { mediaUrl } from '../services/api.js';

const EmptyCartExperience = () => (
  <section className="empty-cart-experience" aria-labelledby="empty-cart-title">
    <div className="empty-cart-copy">
      <p className="eyebrow">Cart</p>
      <h1 id="empty-cart-title">Your cart is ready for something exceptional</h1>
      <p>
        Build a shortlist from our curated watches, save favorites, and return when the right piece finds you.
      </p>
      <div className="empty-cart-actions">
        <Link className="button primary" to="/products">
          <ShoppingBag size={17} />
          Shop watches
          <ArrowRight size={16} />
        </Link>
        <Link className="button dark" to="/account?tab=orders">
          View orders
        </Link>
      </div>
      <div className="empty-cart-perks" aria-label="Shopping benefits">
        <span>
          <ShieldCheck size={16} />
          Secure checkout
        </span>
        <span>
          <PackageCheck size={16} />
          Order tracking
        </span>
        <span>
          <Clock3 size={16} />
          Fast support
        </span>
      </div>
    </div>

    <div className="empty-cart-scene" aria-hidden="true">
      <div className="empty-cart-orbit">
        <span className="empty-cart-tile tile-one">Automatic</span>
        <span className="empty-cart-tile tile-two">Diver</span>
        <span className="empty-cart-tile tile-three">Chrono</span>
        <div className="empty-cart-bag">
          <ShoppingBag size={74} strokeWidth={1.6} />
          <span className="empty-cart-bag-dot" />
        </div>
        <span className="empty-cart-heart">
          <Heart size={18} fill="currentColor" />
        </span>
      </div>
      <div className="empty-cart-shelf" />
    </div>
  </section>
);

export const CartPage = () => {
  const { user } = useAuth();
  const { cart, updateItem, removeItem, applyCoupon } = useCart();
  const { formatMoney } = useCurrency();
  const [coupon, setCoupon] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [updatingItemId, setUpdatingItemId] = useState('');
  const [removingItemId, setRemovingItemId] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  if (!user) {
    return <EmptyState title="Sign in to view your cart" actionLabel="Sign in" actionTo="/login" />;
  }

  if (!cart?.items?.length) {
    return (
      <section className="cart-page section">
        <Seo title="Shopping Cart" noIndex />
        <EmptyCartExperience />
      </section>
    );
  }

  const submitCoupon = async (event) => {
    event.preventDefault();
    setApplyingCoupon(true);
    try {
      await applyCoupon(coupon);
      setMessage('Coupon applied');
      setMessageType('success');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Coupon could not be applied');
      setMessageType('error');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const adjustQuantity = async (item, nextQuantity) => {
    setUpdatingItemId(item._id);
    try {
      await updateItem(item._id, Math.max(1, nextQuantity));
      setMessage('');
      setMessageType('success');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Quantity could not be updated');
      setMessageType('error');
    } finally {
      setUpdatingItemId('');
    }
  };

  const deleteItem = async (item) => {
    setRemovingItemId(item._id);
    try {
      await removeItem(item._id);
      setMessage('');
      setMessageType('success');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Item could not be removed');
      setMessageType('error');
    } finally {
      setRemovingItemId('');
    }
  };

  return (
    <section className="cart-page section">
      <Seo title="Shopping Cart" noIndex />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Cart</p>
          <h1>Review items</h1>
        </div>
        <Link className="text-link" to="/products">
          Continue shopping
        </Link>
      </div>

      <div className="cart-layout">
        <div className="cart-lines">
          {cart.items.map((item) => {
            const stock = item.product?.inventory?.stock;
            const canIncrease = !item.product?.inventory?.trackQuantity || item.quantity < stock;

            return (
              <article className="cart-line" key={item._id}>
                <img src={mediaUrl(item.image)} alt={item.name} />
                <div className="cart-item-info">
                  <h2>{item.name}</h2>
                  <p>{formatMoney(item.price)}</p>
                </div>
                <div className="cart-quantity-control" aria-label={`Quantity for ${item.name}`}>
                  <button
                    type="button"
                    onClick={() => adjustQuantity(item, item.quantity - 1)}
                    disabled={item.quantity <= 1 || updatingItemId === item._id || removingItemId === item._id}
                    aria-label={`Decrease quantity for ${item.name}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span aria-live="polite">
                    {updatingItemId === item._id ? <span className="spinner tiny" /> : item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustQuantity(item, item.quantity + 1)}
                    disabled={!canIncrease || updatingItemId === item._id || removingItemId === item._id}
                    aria-label={`Increase quantity for ${item.name}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <strong className="cart-line-total">{formatMoney(item.price * item.quantity)}</strong>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => deleteItem(item)}
                  disabled={removingItemId === item._id || updatingItemId === item._id}
                  aria-label="Remove item"
                >
                  {removingItemId === item._id ? <span className="spinner tiny" /> : <Trash2 size={17} />}
                </button>
              </article>
            );
          })}
        </div>

        <aside className="summary-panel">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatMoney(cart.totals?.subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Discount</span>
            <strong>-{formatMoney(cart.totals?.discount)}</strong>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>{formatMoney(cart.totals?.total)}</strong>
          </div>

          <form className="coupon-form" onSubmit={submitCoupon}>
            <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Coupon code" />
            <button type="submit" disabled={applyingCoupon}>
              {applyingCoupon ? 'Applying...' : 'Apply'}
            </button>
          </form>
          {message ? (
            <p className={messageType === 'error' ? 'form-error' : 'form-note'} aria-live="polite">
              {message}
            </p>
          ) : null}
          <Link className="button primary full" to="/checkout">
            Checkout
          </Link>
        </aside>
      </div>
    </section>
  );
};
