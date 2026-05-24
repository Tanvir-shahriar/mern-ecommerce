import { ArrowLeft, PackageCheck, Truck, UserRound } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { dateShort, money, statusLabel } from '../utils/format.js';
import { useState } from 'react';

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const AddressBlock = ({ title, address }) => {
  if (!address) return null;

  return (
    <article className="detail-card">
      <h2>{title}</h2>
      <div className="address-lines">
        <strong>{address.fullName}</strong>
        <span>{address.phone}</span>
        <span>{address.line1}</span>
        {address.line2 ? <span>{address.line2}</span> : null}
        <span>
          {address.city}, {address.state} {address.postalCode}
        </span>
        <span>{address.country}</span>
      </div>
    </article>
  );
};

export const OrderDetailPage = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data.data.order;
    }
  });

  const updateStatus = async (status) => {
    setMessage('');
    try {
      const { data } = await api.patch(`/orders/${id}/status`, { status });
      queryClient.setQueryData(['order', id], data.data.order);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setMessage('Order status updated');
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (isError || !order) {
    return <EmptyState title="Order not found" actionLabel="Back to account" actionTo="/account" />;
  }

  const backTo = isAdmin ? '/admin/orders' : '/account';

  return (
    <section className="order-detail-page section">
      <Link className="text-link back-link" to={backTo}>
        <ArrowLeft size={17} />
        Back
      </Link>

      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Order details</p>
          <h1>{order.orderNumber}</h1>
        </div>
        <span className={`status-pill ${order.status}`}>{statusLabel(order.status)}</span>
      </div>

      {message ? <p className="form-note">{message}</p> : null}

      <div className="order-detail-layout">
        <div className="order-detail-main">
          <article className="detail-card">
            <div className="detail-card-heading">
              <div>
                <p className="eyebrow">Items</p>
                <h2>{order.items.length} product(s)</h2>
              </div>
              <PackageCheck size={22} />
            </div>
            <div className="order-item-list">
              {order.items.map((item) => (
                <div className="order-item-detail" key={`${item.product}-${item.name}`}>
                  <img src={mediaUrl(item.image)} alt={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    {item.sku ? <span>SKU: {item.sku}</span> : null}
                    {item.variant ? <span>{Object.entries(item.variant).map(([key, value]) => `${key}: ${value}`).join(', ')}</span> : null}
                  </div>
                  <span>Qty {item.quantity}</span>
                  <strong>{money(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
          </article>

          <div className="detail-grid">
            <AddressBlock title="Shipping address" address={order.shippingAddress} />
            <AddressBlock title="Billing address" address={order.billingAddress} />
          </div>

          <article className="detail-card">
            <div className="detail-card-heading">
              <div>
                <p className="eyebrow">Timeline</p>
                <h2>Order activity</h2>
              </div>
              <Truck size={22} />
            </div>
            <div className="timeline-list">
              {order.timeline?.map((item) => (
                <div className="timeline-item" key={item._id || `${item.status}-${item.at}`}>
                  <span />
                  <div>
                    <strong>{statusLabel(item.status)}</strong>
                    <p>{item.note}</p>
                    <small>{dateShort(item.at)}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="order-detail-side">
          <article className="detail-card">
            <div className="detail-card-heading">
              <div>
                <p className="eyebrow">Customer</p>
                <h2>{order.customer?.name || order.shippingAddress.fullName}</h2>
              </div>
              <UserRound size={22} />
            </div>
            <div className="info-list">
              <span>{order.customer?.email || 'Customer email unavailable'}</span>
              <span>Phone: {order.customer?.phone || order.shippingAddress.phone}</span>
              <span>Placed {dateShort(order.createdAt)}</span>
              <span>Payment: {statusLabel(order.payment?.method || '')}</span>
              <span>Payment status: {statusLabel(order.payment?.status || '')}</span>
            </div>
          </article>

          {isAdmin ? (
            <article className="detail-card">
              <h2>Admin status</h2>
              <label>
                Fulfillment status
                <select value={order.status} onChange={(event) => updateStatus(event.target.value)}>
                  {statuses.map((status) => (
                    <option value={status} key={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ) : null}

          <article className="detail-card">
            <h2>Pricing</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{money(order.pricing.subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <strong>-{money(order.pricing.discount)}</strong>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <strong>{money(order.pricing.tax)}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <strong>{money(order.pricing.shipping)}</strong>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <strong>{money(order.pricing.total)}</strong>
            </div>
          </article>

          {order.customerNote ? (
            <article className="detail-card">
              <h2>Customer note</h2>
              <p className="muted">{order.customerNote}</p>
            </article>
          ) : null}
        </aside>
      </div>
    </section>
  );
};
