import { Download, Eye, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { OrderProgressBar } from '../components/OrderProgressBar.jsx';
import { api, apiErrorMessage } from '../services/api.js';
import { dateShort, money, statusLabel } from '../utils/format.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { orderCustomerEmail, orderCustomerName, orderDetailPath, orderIdentifier } from '../utils/orders.js';

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export const AdminOrdersPage = () => {
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-orders', debouncedSearch, statusFilter],
    queryFn: async () => {
      const { data } = await api.get('/orders', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter
        }
      });
      return data.data;
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

  const exportOrders = async () => {
    try {
      const response = await api.get('/orders/export.csv', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'orders-export.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  return (
    <section className="admin-page section">
      <AdminNav />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Orders</h1>
        </div>
        <div className="toolbar-actions">
          {isFetching ? <span className="admin-fetching"><span className="spinner tiny" /> Syncing</span> : null}
          <button className="button dark" type="button" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })}>
            <RefreshCw size={17} />
            Refresh
          </button>
          <button className="button primary" type="button" onClick={exportOrders}>
            <Download size={17} />
            Export CSV
          </button>
        </div>
      </div>
      {message ? <p className="form-note">{message}</p> : null}
      <div className="panel">
        <div className="admin-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, SKU" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Order status">
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option value={status} key={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
          {pagination ? <span className="search-meta">{pagination.total} order(s)</span> : null}
        </div>
        {isLoading ? (
          <AdminLoadingState label="Loading orders" />
        ) : (
          <div className="admin-order-table">
            <div className="table-head">
              <span>Order</span>
              <span>Customer</span>
              <span>Date</span>
              <span>Total</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {orders.map((order) => {
              const customerName = orderCustomerName(order);
              const customerEmail = orderCustomerEmail(order);
              const orderId = order._id || order.id;
              const isExpanded = !!expandedOrders[orderId];

              return (
                <div className="admin-order-row-wrapper" key={orderIdentifier(order)}>
                  <article className="table-row">
                    <strong>{order.orderNumber}</strong>
                    <span className="table-customer">
                      <strong>{customerName}</strong>
                      {customerEmail ? <small>{customerEmail}</small> : null}
                    </span>
                    <span>{dateShort(order.createdAt)}</span>
                    <strong>{money(order.pricing.total)}</strong>
                    <select value={order.status} onChange={(event) => updateStatus(orderId, event.target.value)} aria-label={`Status for ${order.orderNumber}`}>
                      {statuses.map((status) => (
                        <option value={status} key={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                    <div className="table-actions-cell" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="button compact secondary"
                        onClick={() => toggleExpand(orderId)}
                        title="Toggle Progress Tracker"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        Tracker
                      </button>
                      <Link className="button compact" to={orderDetailPath(order)}>
                        <Eye size={16} />
                        View
                      </Link>
                    </div>
                  </article>
                  {isExpanded && (
                    <div className="admin-inline-tracker" style={{ padding: '12px 16px 4px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <OrderProgressBar
                        status={order.status}
                        onUpdateStatus={(newStatus) => updateStatus(orderId, newStatus)}
                        isAdmin
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
