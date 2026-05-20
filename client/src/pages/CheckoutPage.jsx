import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { api, apiErrorMessage } from '../services/api.js';
import { money } from '../utils/format.js';

const initialAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'United States'
};

export const CheckoutPage = () => {
  const { cart, fetchCart } = useCart();
  const [address, setAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [customerNote, setCustomerNote] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (order) {
    return (
      <section className="success-page section">
        <CheckCircle2 size={48} />
        <h1>Order placed</h1>
        <p>{order.orderNumber}</p>
        <Link className="button primary" to={`/orders/${order._id}`}>
          View order details
        </Link>
      </section>
    );
  }

  if (!cart?.items?.length) {
    return <EmptyState title="Your cart is empty" actionLabel="Shop products" actionTo="/products" />;
  }

  const updateAddress = (key, value) => {
    setAddress((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { data } = await api.post('/orders', {
        shippingAddress: address,
        paymentMethod,
        customerNote
      });
      setOrder(data.data.order);
      await fetchCart();
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="checkout-page section">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Shipping and payment</h1>
        </div>
      </div>
      <div className="checkout-layout">
        <form className="form-panel" onSubmit={submit}>
          <div className="form-grid">
            <label>
              Full name
              <input required value={address.fullName} onChange={(event) => updateAddress('fullName', event.target.value)} />
            </label>
            <label>
              Phone
              <input required value={address.phone} onChange={(event) => updateAddress('phone', event.target.value)} />
            </label>
            <label className="span-2">
              Address line 1
              <input required value={address.line1} onChange={(event) => updateAddress('line1', event.target.value)} />
            </label>
            <label className="span-2">
              Address line 2
              <input value={address.line2} onChange={(event) => updateAddress('line2', event.target.value)} />
            </label>
            <label>
              City
              <input required value={address.city} onChange={(event) => updateAddress('city', event.target.value)} />
            </label>
            <label>
              State
              <input required value={address.state} onChange={(event) => updateAddress('state', event.target.value)} />
            </label>
            <label>
              Postal code
              <input required value={address.postalCode} onChange={(event) => updateAddress('postalCode', event.target.value)} />
            </label>
            <label>
              Country
              <input required value={address.country} onChange={(event) => updateAddress('country', event.target.value)} />
            </label>
          </div>

          <div className="segmented">
            {[
              ['cash_on_delivery', 'Cash'],
              ['card', 'Card'],
              ['paypal', 'PayPal']
            ].map(([value, label]) => (
              <button
                type="button"
                className={paymentMethod === value ? 'active' : ''}
                key={value}
                onClick={() => setPaymentMethod(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <label>
            Note
            <textarea value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <aside className="summary-panel">
          <h2>Totals</h2>
          <div className="summary-row">
            <span>Items</span>
            <strong>{cart.items.length}</strong>
          </div>
          <div className="summary-row">
            <span>Cart total</span>
            <strong>{money(cart.totals?.total)}</strong>
          </div>
          <p className="muted">Tax and shipping are finalized after order submission.</p>
        </aside>
      </div>
    </section>
  );
};
