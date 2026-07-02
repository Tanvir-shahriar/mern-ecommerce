import { ArrowLeft, PackageCheck, Star, Truck, UserRound } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { OrderProgressBar } from '../components/OrderProgressBar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { dateShort, statusLabel } from '../utils/format.js';
import { orderCustomerEmail, orderCustomerName, orderCustomerPhone, orderIdentifier } from '../utils/orders.js';
import { useState, useEffect } from 'react';
import { Seo } from '../components/Seo.jsx';

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const emptyReview = { rating: 5, comment: '' };

const orderItemProductId = (item) => (typeof item.product === 'object' ? item.product?._id : item.product);
const productReviewPath = (item) => `/products/${orderItemProductId(item)}#reviews`;

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
  const { formatMoney, formatBaseMoney } = useCurrency();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewingProducts, setReviewingProducts] = useState({});
  const [reviewedProducts, setReviewedProducts] = useState({});
  const backTo = isAdmin ? '/admin/orders' : '/account';

  // Admin order detail adjustment states
  const [adminStatus, setAdminStatus] = useState('');
  const [adminExpectedDate, setAdminExpectedDate] = useState('');
  const [adminAddress, setAdminAddress] = useState({});

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data.data.order;
    }
  });

  useEffect(() => {
    if (order) {
      setAdminStatus(order.status || 'pending');
      const dateVal = order.expectedDeliveryDate
        ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0]
        : '';
      setAdminExpectedDate(dateVal);
      setAdminAddress(order.shippingAddress || {});
    }
  }, [order]);

  const updateStatus = async (status) => {
    setMessage({ text: '', type: 'success' });
    try {
      const statusOrderId = order?._id || order?.id || id;
      const { data } = await api.patch(`/orders/${statusOrderId}/status`, { status });
      queryClient.setQueryData(['order', id], data.data.order);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setAdminStatus(status);
      setMessage({ text: 'Order status updated', type: 'success' });
    } catch (error) {
      setMessage({ text: apiErrorMessage(error), type: 'error' });
    }
  };

  const handleAdminUpdateOrder = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: 'success' });
    try {
      const statusOrderId = order?._id || order?.id || id;
      const { data } = await api.patch(`/orders/${statusOrderId}/status`, {
        status: adminStatus,
        expectedDeliveryDate: adminExpectedDate || undefined,
        shippingAddress: adminAddress
      });
      queryClient.setQueryData(['order', id], data.data.order);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setMessage({ text: 'Order details updated successfully', type: 'success' });
    } catch (error) {
      setMessage({ text: apiErrorMessage(error), type: 'error' });
    }
  };

  const updateReviewDraft = (productId, key, value) => {
    setReviewDrafts((current) => ({
      ...current,
      [productId]: {
        ...emptyReview,
        ...(current[productId] || {}),
        [key]: value
      }
    }));
  };

  const submitReview = async (event, item) => {
    event.preventDefault();
    const productId = orderItemProductId(item);
    const draft = reviewDrafts[productId] || emptyReview;

    setMessage({ text: '', type: 'success' });
    setReviewingProducts((current) => ({ ...current, [productId]: true }));
    try {
      const { data } = await api.post(`/products/${productId}/reviews`, {
        ...draft,
        orderId: orderIdentifier(order)
      });
      const reviewedProduct = data.data.product;
      if (reviewedProduct) {
        queryClient.setQueryData(['product', productId], reviewedProduct);
        if (reviewedProduct.slug) queryClient.setQueryData(['product', reviewedProduct.slug], reviewedProduct);
      }
      setReviewedProducts((current) => ({ ...current, [productId]: true }));
      setReviewDrafts((current) => ({
        ...current,
        [productId]: emptyReview
      }));
      queryClient.invalidateQueries({ queryKey: ['product'] });
      setMessage({ text: 'Review submitted. It will show below the product reviews.', type: 'success' });
    } catch (error) {
      setMessage({ text: apiErrorMessage(error), type: 'error' });
    } finally {
      setReviewingProducts((current) => ({ ...current, [productId]: false }));
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (isError || !order) {
    return <EmptyState title="Order not found" actionLabel={isAdmin ? 'Back to orders' : 'Back to account'} actionTo={backTo} />;
  }

  const canReviewDeliveredItems = !isAdmin && order.status === 'delivered';
  const customerName = orderCustomerName(order);
  const customerEmail = orderCustomerEmail(order);
  const customerPhone = orderCustomerPhone(order);
  const accountName = order.customer?.accountName;
  const accountEmail = order.customer?.accountEmail;

  return (
    <section className="order-detail-page section">
      <Seo title={`Order #${order.orderNumber}`} noIndex />
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

      {message.text ? <p className={message.type === 'error' ? 'form-error' : 'form-note'}>{message.text}</p> : null}

      <OrderProgressBar status={order.status} expectedDeliveryDate={order.expectedDeliveryDate} onUpdateStatus={updateStatus} isAdmin={isAdmin} />

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
              {order.items.map((item) => {
                const productId = orderItemProductId(item);
                const draft = reviewDrafts[productId] || emptyReview;
                const canReviewItem = canReviewDeliveredItems && productId && !reviewedProducts[productId];

                return (
                  <div className="order-item-detail" key={`${productId}-${item.name}`}>
                    <img src={mediaUrl(item.image)} alt={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      {item.sku ? <span>SKU: {item.sku}</span> : null}
                      {item.variant ? <span>{Object.entries(item.variant).map(([key, value]) => `${key}: ${value}`).join(', ')}</span> : null}
                    </div>
                    <span>Qty {item.quantity}</span>
                    <strong>{isAdmin ? formatBaseMoney(item.price * item.quantity) : formatMoney(item.price * item.quantity)}</strong>

                    {canReviewItem ? (
                      <form className="order-review-form" onSubmit={(event) => submitReview(event, item)}>
                        <h3>Write a review</h3>
                        <div className="order-review-grid">
                          <div className="order-review-rating">
                            <span>Rating</span>
                            <div className="star-rating-control" aria-label={`Rating ${draft.rating} out of 5`}>
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  type="button"
                                  className={rating <= draft.rating ? 'star-rating-button active' : 'star-rating-button'}
                                  key={rating}
                                  onClick={() => updateReviewDraft(productId, 'rating', rating)}
                                  aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
                                >
                                  <Star size={22} fill="currentColor" />
                                </button>
                              ))}
                            </div>
                          </div>
                          <label className="span-2">
                            Comment
                            <textarea required value={draft.comment} onChange={(event) => updateReviewDraft(productId, 'comment', event.target.value)} />
                          </label>
                        </div>
                        <button className="button dark compact" type="submit" disabled={reviewingProducts[productId]}>
                          <Star size={16} />
                          {reviewingProducts[productId] ? 'Submitting...' : 'Post review'}
                        </button>
                      </form>
                    ) : reviewedProducts[productId] ? (
                      <div className="order-review-submitted">
                        <span>Review submitted</span>
                        <Link className="text-link" to={productReviewPath(item)}>
                          View under product
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
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
          {/* Estimated Delivery Card for Customers */}
          <article className="detail-card text-card reddish-accent-card" style={{ borderLeft: '4px solid var(--red, #c74132)' }}>
            <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>Estimated Delivery</h3>
            <p style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 'bold', color: 'var(--red, #c74132)' }}>
              {order.expectedDeliveryDate ? dateShort(order.expectedDeliveryDate) : 'Within 7 Days'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
              Updates are sent automatically via email. Standard shipping window is 7 days.
            </p>
          </article>

          <article className="detail-card">
            <div className="detail-card-heading">
              <div>
                <p className="eyebrow">Customer</p>
                <h2>{customerName}</h2>
              </div>
              <UserRound size={22} />
            </div>
            <div className="info-list">
              <span>Email: {customerEmail || 'Unavailable'}</span>
              <span>Delivery phone: {customerPhone || 'Unavailable'}</span>
              <span>Account: {accountName || customerName}</span>
              {accountEmail && accountEmail !== customerEmail ? <span>Account email: {accountEmail}</span> : null}
              <span>Placed {dateShort(order.createdAt)}</span>
              <span>Payment: {statusLabel(order.payment?.method || '')}</span>
              <span>Payment status: {statusLabel(order.payment?.status || '')}</span>
            </div>
          </article>

          {isAdmin ? (
            <article className="detail-card">
              <h2 style={{ marginBottom: '12px' }}>Fulfillment & Delivery Settings</h2>
              <form onSubmit={handleAdminUpdateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: '600' }}>
                  Fulfillment Status
                  <select value={adminStatus} onChange={(event) => setAdminStatus(event.target.value)} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)' }}>
                    {statuses.map((status) => (
                      <option value={status} key={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: '600' }}>
                  Expected Arrival Date
                  <input
                    type="date"
                    value={adminExpectedDate}
                    onChange={(event) => setAdminExpectedDate(event.target.value)}
                    style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)' }}
                  />
                </label>

                <fieldset style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                  <legend style={{ padding: '0 6px', fontSize: '12px', fontWeight: '700', color: '#555' }}>Expected Delivery Address</legend>
                  
                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    Recipient Full Name
                    <input
                      type="text"
                      value={adminAddress.fullName || ''}
                      onChange={(event) => setAdminAddress(prev => ({ ...prev, fullName: event.target.value }))}
                      style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)' }}
                    />
                  </label>

                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    Recipient Phone
                    <input
                      type="text"
                      value={adminAddress.phone || ''}
                      onChange={(event) => setAdminAddress(prev => ({ ...prev, phone: event.target.value }))}
                      style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)' }}
                    />
                  </label>

                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    Address Line 1
                    <input
                      type="text"
                      value={adminAddress.line1 || ''}
                      onChange={(event) => setAdminAddress(prev => ({ ...prev, line1: event.target.value }))}
                      style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)' }}
                    />
                  </label>

                  <label style={{ fontSize: '11px', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    Address Line 2
                    <input
                      type="text"
                      value={adminAddress.line2 || ''}
                      onChange={(event) => setAdminAddress(prev => ({ ...prev, line2: event.target.value }))}
                      style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)' }}
                    />
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      City
                      <input
                        type="text"
                        value={adminAddress.city || ''}
                        onChange={(event) => setAdminAddress(prev => ({ ...prev, city: event.target.value }))}
                        style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)', width: '100%' }}
                      />
                    </label>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      State / Division
                      <input
                        type="text"
                        value={adminAddress.state || ''}
                        onChange={(event) => setAdminAddress(prev => ({ ...prev, state: event.target.value }))}
                        style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)', width: '100%' }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      Postal Code
                      <input
                        type="text"
                        value={adminAddress.postalCode || ''}
                        onChange={(event) => setAdminAddress(prev => ({ ...prev, postalCode: event.target.value }))}
                        style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)', width: '100%' }}
                      />
                    </label>
                    <label style={{ fontSize: '11px', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      Country
                      <input
                        type="text"
                        value={adminAddress.country || ''}
                        onChange={(event) => setAdminAddress(prev => ({ ...prev, country: event.target.value }))}
                        style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)', width: '100%' }}
                      />
                    </label>
                  </div>
                </fieldset>

                <button className="button primary compact" type="submit" style={{ marginTop: '8px', cursor: 'pointer' }}>
                  Update Order Details
                </button>
              </form>
            </article>
          ) : null}

          <article className="detail-card">
            <h2>Pricing</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{isAdmin ? formatBaseMoney(order.pricing.subtotal) : formatMoney(order.pricing.subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <strong>-{isAdmin ? formatBaseMoney(order.pricing.discount) : formatMoney(order.pricing.discount)}</strong>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <strong>{isAdmin ? formatBaseMoney(order.pricing.tax) : formatMoney(order.pricing.tax)}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <strong>{isAdmin ? formatBaseMoney(order.pricing.shipping) : formatMoney(order.pricing.shipping)}</strong>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <strong>{isAdmin ? formatBaseMoney(order.pricing.total) : formatMoney(order.pricing.total)}</strong>
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
