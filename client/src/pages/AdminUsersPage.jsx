import { Mail, Search, Shield, UserCog, UserRound } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { Seo } from '../components/Seo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { dateShort, money, statusLabel } from '../utils/format.js';
import { orderDetailPath, orderIdentifier } from '../utils/orders.js';

const userIdentifier = (user) => user?._id || user?.id || '';

const AddressSummary = ({ address }) => (
  <article className="admin-user-address">
    <div>
      <strong>{address.label || 'Address'}</strong>
      {address.isDefault ? <span className="status-pill active">Default</span> : null}
    </div>
    <span>{address.fullName}</span>
    <span>{address.phone}</span>
    <span>{address.line1}</span>
    {address.line2 ? <span>{address.line2}</span> : null}
    <span>
      {[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}
    </span>
    <span>{address.country || 'Bangladesh'}</span>
  </article>
);

export const AdminUsersPage = () => {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [accessMessage, setAccessMessage] = useState('');
  const [accessError, setAccessError] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();
  const { user: currentUser, isSuperAdmin } = useAuth();

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
  const selectedId = selectedUserId || userIdentifier(users[0]);
  const selectedListUser = users.find((user) => userIdentifier(user) === selectedId);

  const accessMutation = useMutation({
    mutationFn: async ({ userId, payload }) => {
      const { data } = await api.patch(`/users/${userId}/role`, payload);
      return data.data.user;
    },
    onSuccess: () => {
      setAccessError('');
      setAccessMessage('User access updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ['admin-user', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (error) => {
      setAccessMessage('');
      setAccessError(apiErrorMessage(error));
    }
  });

  const { data: selectedUserData, isLoading: detailLoading, isFetching: detailFetching, isError: detailError, error: detailRequestError } = useQuery({
    queryKey: ['admin-user', selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const { data } = await api.get(`/users/${selectedId}`);
      return data.data;
    }
  });

  const detail = selectedUserData;
  const selectedIsSelf = Boolean(userIdentifier(detail?.user) && userIdentifier(detail.user) === userIdentifier(currentUser));
  const selectedIsSuperAdmin = detail?.user?.role === 'super_admin';
  const canEditAccess = Boolean(isSuperAdmin && detail?.user && !selectedIsSelf && !selectedIsSuperAdmin);

  useEffect(() => {
    setAccessMessage('');
    setAccessError('');
  }, [selectedId]);

  useEffect(() => {
    if (!users.length) {
      setSelectedUserId('');
      return;
    }

    if (!selectedUserId || !users.some((user) => userIdentifier(user) === selectedUserId)) {
      setSelectedUserId(userIdentifier(users[0]));
    }
  }, [selectedUserId, users]);

  const updateAccess = (payload) => {
    if (!selectedId || accessMutation.isPending) return;
    accessMutation.mutate({ userId: selectedId, payload });
  };

  return (
    <section className="admin-page section">
      <Seo title="Admin Users" noIndex />
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
                  className={selectedId === userIdentifier(user) ? 'user-row active' : 'user-row'}
                  key={userIdentifier(user)}
                  onClick={() => setSelectedUserId(userIdentifier(user))}
                >
                  <span className="user-avatar">
                    <UserRound size={18} />
                  </span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </span>
                  <span className="user-access-pills">
                    <span className={`status-pill role-${user.role}`}>{statusLabel(user.role)}</span>
                    <span className={`status-pill ${user.status}`}>{statusLabel(user.status)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="panel user-detail-panel">
          {detailLoading || (detailFetching && !detail) ? (
            <AdminLoadingState label="Loading user details" />
          ) : detailError ? (
            <div className="user-detail-empty">
              <p className="form-error">{apiErrorMessage(detailRequestError)}</p>
              {selectedListUser ? (
                <div className="info-list">
                  <span>
                    <Mail size={15} />
                    {selectedListUser.email}
                  </span>
                  <span>
                    <Shield size={15} />
                    {statusLabel(selectedListUser.role)} / {statusLabel(selectedListUser.status)}
                  </span>
                </div>
              ) : null}
            </div>
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
                <span>User ID: {userIdentifier(detail.user)}</span>
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

              <h3>Access control</h3>
              <div className="access-control-panel">
                <span className="access-control-title">
                  <UserCog size={16} />
                  {isSuperAdmin ? 'Super admin controls' : 'Super admin required'}
                </span>
                {isSuperAdmin ? (
                  selectedIsSelf || selectedIsSuperAdmin ? (
                    <p className="muted">The super admin account is protected from access changes here.</p>
                  ) : (
                    <div className="access-control-grid">
                      <label>
                        Role
                        <select
                          value={detail.user.role}
                          disabled={!canEditAccess || accessMutation.isPending}
                          onChange={(event) => updateAccess({ role: event.target.value })}
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>
                      <label>
                        Status
                        <select
                          value={detail.user.status}
                          disabled={!canEditAccess || accessMutation.isPending}
                          onChange={(event) => updateAccess({ status: event.target.value })}
                        >
                          <option value="active">Active</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </label>
                    </div>
                  )
                ) : (
                  <p className="muted">Only the super admin can assign admin access.</p>
                )}
                {accessMutation.isPending ? (
                  <span className="admin-fetching">
                    <span className="spinner tiny" /> Updating access
                  </span>
                ) : null}
                {accessMessage ? <p className="form-note">{accessMessage}</p> : null}
                {accessError ? <p className="form-error">{accessError}</p> : null}
              </div>

              <h3>Addresses</h3>
              <div className="admin-user-address-list">
                {detail.user.addresses?.length ? (
                  detail.user.addresses.map((address) => (
                    <AddressSummary address={address} key={address._id || `${address.label}-${address.line1}`} />
                  ))
                ) : (
                  <p className="muted">No saved addresses.</p>
                )}
              </div>

              <h3>Recent orders</h3>
              <div className="order-list">
                {detail.orders.length ? (
                  detail.orders.map((order) => (
                    <Link className="order-row" to={orderDetailPath(order)} key={orderIdentifier(order)}>
                      <div>
                        <strong>{order.itemSummary?.label || order.orderNumber}</strong>
                        <span>
                          {order.orderNumber} · {dateShort(order.createdAt)}
                        </span>
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
