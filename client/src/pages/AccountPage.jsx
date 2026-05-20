import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { dateShort, money, statusLabel } from '../utils/format.js';

export const AccountPage = () => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [message, setMessage] = useState('');

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders/mine');
      return data.data.orders;
    }
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get('/users/wishlist');
      return data.data.wishlist;
    }
  });

  const submit = async (event) => {
    event.preventDefault();
    try {
      await updateProfile(profile);
      setMessage('Profile updated');
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  return (
    <section className="account-page section">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Account</p>
          <h1>{user?.name}</h1>
        </div>
      </div>

      <div className="account-grid">
        <form className="form-panel" onSubmit={submit}>
          <h2>Profile</h2>
          <label>
            Name
            <input value={profile.name} onChange={(event) => setProfile((value) => ({ ...value, name: event.target.value }))} />
          </label>
          <label>
            Phone
            <input value={profile.phone} onChange={(event) => setProfile((value) => ({ ...value, phone: event.target.value }))} />
          </label>
          {message ? <p className="form-note">{message}</p> : null}
          <button className="button dark" type="submit">
            Save changes
          </button>
        </form>

        <div className="panel">
          <h2>Orders</h2>
          <div className="order-list">
            {orders.length ? (
              orders.map((order) => (
                <Link className="order-row" key={order._id} to={`/orders/${order._id}`}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{dateShort(order.createdAt)}</span>
                  </div>
                  <span className={`status-pill ${order.status}`}>{statusLabel(order.status)}</span>
                  <strong>{money(order.pricing.total)}</strong>
                </Link>
              ))
            ) : (
              <p className="muted">No orders yet.</p>
            )}
          </div>
        </div>

        <div className="panel span-2">
          <h2>Wishlist</h2>
          <div className="wishlist-grid">
            {wishlist.length ? (
              wishlist.map((product) => (
                <Link className="wishlist-item" key={product._id} to={`/products/${product.slug}`}>
                  <img src={mediaUrl(product.images?.[0]?.url)} alt={product.name} />
                  <span>{product.name}</span>
                  <strong>{money(product.price)}</strong>
                </Link>
              ))
            ) : (
              <p className="muted">No saved products.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
