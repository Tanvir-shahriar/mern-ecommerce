import { Eye, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminNav } from '../components/AdminNav.jsx';
import { api, apiErrorMessage } from '../services/api.js';
import { dateShort, money, statusLabel } from '../utils/format.js';

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export const AdminOrdersPage = () => {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders');
      return data.data.orders;
    }
  });

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setMessage('Order updated');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  return (
    <section className="admin-page section">
      <AdminNav />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Orders</h1>
        </div>
        <button className="button dark" type="button" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>
      {message ? <p className="form-note">{message}</p> : null}
      <div className="panel">
        <div className="admin-order-table">
          <div className="table-head">
            <span>Order</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Total</span>
            <span>Status</span>
            <span>Details</span>
          </div>
          {data?.map((order) => (
            <article className="table-row" key={order._id}>
              <strong>{order.orderNumber}</strong>
              <span>{order.user?.email || 'Guest'}</span>
              <span>{dateShort(order.createdAt)}</span>
              <strong>{money(order.pricing.total)}</strong>
              <select value={order.status} onChange={(event) => updateStatus(order._id, event.target.value)} aria-label={`Status for ${order.orderNumber}`}>
                {statuses.map((status) => (
                  <option value={status} key={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
              <Link className="button compact" to={`/orders/${order._id}`}>
                <Eye size={16} />
                View
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
