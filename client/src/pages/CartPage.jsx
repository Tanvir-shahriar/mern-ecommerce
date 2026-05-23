import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { mediaUrl } from '../services/api.js';
import { money } from '../utils/format.js';
import { useState } from 'react';

export const CartPage = () => {
  const { user } = useAuth();
  const { cart, updateItem, removeItem, applyCoupon } = useCart();
  const [coupon, setCoupon] = useState('');
  const [message, setMessage] = useState('');

  if (!user) {
    return <EmptyState title="Sign in to view your cart" actionLabel="Sign in" actionTo="/login" />;
  }

  if (!cart?.items?.length) {
    return <EmptyState title="Your cart is empty" message="Add a watch before checkout." actionLabel="Shop watches" actionTo="/products" />;
  }

  const submitCoupon = async (event) => {
    event.preventDefault();
    try {
      await applyCoupon(coupon);
      setMessage('Coupon applied');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Coupon could not be applied');
    }
  };

  const adjustQuantity = async (item, nextQuantity) => {
    try {
      await updateItem(item._id, Math.max(1, nextQuantity));
      setMessage('');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Quantity could not be updated');
    }
  };

  return (
    <section className="cart-page section">
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
                  <p>{money(item.price)}</p>
                </div>
                <div className="cart-quantity-control" aria-label={`Quantity for ${item.name}`}>
                  <button
                    type="button"
                    onClick={() => adjustQuantity(item, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label={`Decrease quantity for ${item.name}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => adjustQuantity(item, item.quantity + 1)}
                    disabled={!canIncrease}
                    aria-label={`Increase quantity for ${item.name}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <strong className="cart-line-total">{money(item.price * item.quantity)}</strong>
                <button type="button" className="icon-button" onClick={() => removeItem(item._id)} aria-label="Remove item">
                  <Trash2 size={17} />
                </button>
              </article>
            );
          })}
        </div>

        <aside className="summary-panel">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{money(cart.totals?.subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Discount</span>
            <strong>-{money(cart.totals?.discount)}</strong>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>{money(cart.totals?.total)}</strong>
          </div>

          <form className="coupon-form" onSubmit={submitCoupon}>
            <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Coupon code" />
            <button type="submit">Apply</button>
          </form>
          {message ? <p className="form-note">{message}</p> : null}
          <Link className="button primary full" to="/checkout">
            Checkout
          </Link>
        </aside>
      </div>
    </section>
  );
};
