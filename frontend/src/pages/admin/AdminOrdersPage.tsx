import { useEffect, useState } from 'react';

import {
  getAdminOrders,
  updateAdminOrderStatus,
  type AdminOrderListItem,
  type AdminOrderStatus,
} from '../../lib/api';

const statusLabels: Record<AdminOrderStatus, string> = {
  new: 'New',
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
  cancelled: 'Cancelled',
};

const statuses: AdminOrderStatus[] = ['new', 'received', 'preparing', 'ready', 'cancelled'];

function AdminLoginRequired() {
  return (
    <main className="page-shell admin-page">
      <section className="status-card">
        <p className="status-label">Admin login required.</p>
        <a className="cart-link" href="/admin/login">Go to login</a>
      </section>
    </main>
  );
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const token = window.localStorage.getItem('dom_admin_token');

  useEffect(() => {
    if (!token) return;
    getAdminOrders(token)
      .then(setOrders)
      .catch((ordersError) => {
        setError(ordersError instanceof Error ? ordersError.message : 'Could not load recent orders.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <AdminLoginRequired />;

  async function handleStatusChange(orderId: string, nextStatus: AdminOrderStatus) {
    if (!token) return;
    setUpdatingId(orderId);
    setError('');
    try {
      const updated = await updateAdminOrderStatus(token, orderId, nextStatus);
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status: updated.status, status_label: updated.status_label }
            : order,
        ),
      );
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Could not update this order.');
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <main className="page-shell admin-page">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Orders</h1>
        </div>
        <a href="/admin/dashboard">Dashboard</a>
      </section>
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <section className="skeleton-card">Loading recent orders…</section> : null}
      {!loading && orders.length === 0 ? <section className="skeleton-card">No orders yet.</section> : null}
      {orders.length > 0 ? (
        <section className="admin-orders-list" aria-label="Recent admin orders">
          {orders.map((order) => (
            <article className="status-card admin-order-card" key={order.id} aria-label={`Order #${order.order_number} controls`}>
              <div>
                <p className="eyebrow">Order #{order.order_number}</p>
                <h2>{order.guest_name}</h2>
                <p className="detail-copy">{order.items_count === 1 ? '1 item' : `${order.items_count} items`}</p>
              </div>
              <p className="status-label">{statusLabels[order.status]}</p>
              <label>
                Update status
                <select
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(event) => handleStatusChange(order.id, event.target.value as AdminOrderStatus)}
                >
                  {statuses.map((status) => (
                    <option value={status} key={status}>{statusLabels[status]}</option>
                  ))}
                </select>
              </label>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
