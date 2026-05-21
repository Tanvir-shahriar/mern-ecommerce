import { AlertTriangle, Boxes, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { api, mediaUrl } from '../services/api.js';
import { dateShort, money, statusLabel } from '../utils/format.js';

const metricIcon = {
  totalRevenue: DollarSign,
  ordersCount: ShoppingCart,
  productsCount: Boxes,
  usersCount: Users
};

export const AdminDashboardPage = () => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard');
      return data.data;
    }
  });

  const metrics = data?.metrics || {};

  return (
    <section className="admin-page section">
      <AdminNav />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Dashboard</h1>
        </div>
        {isFetching ? <span className="admin-fetching"><span className="spinner tiny" /> Syncing</span> : null}
      </div>

      <div className="metric-grid">
        {[
          ['totalRevenue', 'Revenue', money(metrics.totalRevenue)],
          ['ordersCount', 'Orders', metrics.ordersCount || 0],
          ['productsCount', 'Products', metrics.productsCount || 0],
          ['usersCount', 'Customers', metrics.usersCount || 0]
        ].map(([key, label, value]) => {
          const Icon = metricIcon[key];
          return (
            <article className="metric-card" key={key}>
              <Icon size={22} />
              <span>{label}</span>
              <strong>{isLoading ? <span className="spinner tiny" /> : value}</strong>
            </article>
          );
        })}
      </div>

      <div className="admin-grid">
        <div className="panel">
          <h2>Recent orders</h2>
          {isLoading ? (
            <AdminLoadingState label="Loading recent orders" />
          ) : (
            <div className="order-list">
              {data?.recentOrders?.map((order) => (
                <article className="order-row" key={order._id}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{order.user?.email || dateShort(order.createdAt)}</span>
                  </div>
                  <span className={`status-pill ${order.status}`}>{statusLabel(order.status)}</span>
                  <strong>{money(order.pricing.total)}</strong>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Low stock</h2>
          {isLoading ? (
            <AdminLoadingState label="Checking stock levels" />
          ) : (
            <div className="low-stock-list">
              {data?.lowStockProducts?.length ? (
                data.lowStockProducts.map((product) => (
                  <article className="low-stock-row" key={product._id}>
                    <img src={mediaUrl(product.images?.[0]?.url)} alt={product.name} />
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.sku}</span>
                    </div>
                    <span className="warning">
                      <AlertTriangle size={15} />
                      {product.inventory.stock}
                    </span>
                  </article>
                ))
              ) : (
                <p className="muted">Inventory is healthy.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
