import { Mail, Search, Shield, UserRound } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { api, mediaUrl } from '../services/api.js';
import { dateShort, money, statusLabel } from '../utils/format.js';

export const AdminUsersPage = () => {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading: usersLoading, isFetching: usersFetching } = useQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: async () => {
      const { data } = await api.get('/users', {
        params: {
          search: debouncedSearch || undefined,
          limit: 50
        }
      });
      return data.data;
    }
  });

  const users = data?.users || [];
  const selectedId = selectedUserId || users[0]?._id;

  const { data: selectedUserData, isLoading: detailLoading, isFetching: detailFetching } = useQuery({
    queryKey: ['admin-user', selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const { data } = await api.get(`/users/${selectedId}`);
      return data.data;
    }
  });

  const detail = selectedUserData;

  return (
    <section className="admin-page section">
      <AdminNav />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Users</h1>
        </div>
      </div>

      <div className="admin-users-layout">
        <div className="panel">
          <div className="admin-toolbar">
            <label className="search-field">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, phone" />
            </label>
            <span className="search-meta">
              {usersFetching ? <span className="admin-fetching"><span className="spinner tiny" /> Syncing</span> : `${data?.pagination?.total || 0} user(s)`}
            </span>
          </div>

          {usersLoading ? (
            <AdminLoadingState label="Loading users" />
          ) : (
            <div className="user-list">
              {users.map((user) => (
                <button
                  type="button"
                  className={selectedId === user._id ? 'user-row active' : 'user-row'}
                  key={user._id}
                  onClick={() => setSelectedUserId(user._id)}
                >
                  <span className="user-avatar">
                    <UserRound size={18} />
                  </span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </span>
                  <span className={`status-pill ${user.status}`}>{statusLabel(user.status)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="panel user-detail-panel">
          {detailLoading || detailFetching ? (
            <AdminLoadingState label="Loading user details" />
          ) : detail ? (
            <>
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">Customer profile</p>
                  <h2>{detail.user.name}</h2>
                </div>
                <span className="user-avatar large">
                  <UserRound size={24} />
                </span>
              </div>

              <div className="info-list">
                <span>
                  <Mail size={15} />
                  {detail.user.email}
                </span>
                <span>
                  <Shield size={15} />
                  {statusLabel(detail.user.role)} / {statusLabel(detail.user.status)}
                </span>
                <span>Phone: {detail.user.phone || 'Not provided'}</span>
                <span>Joined: {dateShort(detail.user.createdAt)}</span>
                <span>Last login: {dateShort(detail.user.lastLoginAt)}</span>
              </div>

              <div className="metric-grid compact">
                <article className="metric-card">
                  <span>Orders</span>
                  <strong>{detail.stats.ordersCount}</strong>
                </article>
                <article className="metric-card">
                  <span>Total spent</span>
                  <strong>{money(detail.stats.totalSpent)}</strong>
                </article>
              </div>

              <h3>Recent orders</h3>
              <div className="order-list">
                {detail.orders.length ? (
                  detail.orders.map((order) => (
                    <Link className="order-row" to={`/orders/${order._id}`} key={order._id}>
                      <div>
                        <strong>{order.orderNumber}</strong>
                        <span>{dateShort(order.createdAt)}</span>
                      </div>
                      <span className={`status-pill ${order.status}`}>{statusLabel(order.status)}</span>
                      <strong>{money(order.pricing.total)}</strong>
                    </Link>
                  ))
                ) : (
                  <p className="muted">No orders found.</p>
                )}
              </div>

              <h3>Wishlist</h3>
              <div className="mini-product-list">
                {detail.user.wishlist?.length ? (
                  detail.user.wishlist.map((product) => (
                    <Link to={`/products/${product.slug}`} key={product._id}>
                      <img src={mediaUrl(product.images?.[0]?.url)} alt={product.name} />
                      <span>{product.name}</span>
                    </Link>
                  ))
                ) : (
                  <p className="muted">No saved products.</p>
                )}
              </div>
            </>
          ) : (
            <p className="muted">Select a user to see details.</p>
          )}
        </aside>
      </div>
    </section>
  );
};
