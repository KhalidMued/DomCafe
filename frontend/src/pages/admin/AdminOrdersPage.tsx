import { useEffect, useRef, useState } from 'react';

import {
  ApiError,
  getAdminOrders,
  hasAdminSession,
  updateAdminOrderStatus,
  type AdminOrderListItem,
  type AdminOrderStatus,
} from '../../lib/api';
import { subscribeOrderEvents } from '../../lib/orderEvents';
import { AdminLayout, AdminLoginRequired } from './AdminLayout';

const statusLabels: Record<AdminOrderStatus, string> = {
  new: 'New',
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
  cancelled: 'Cancelled',
};

const submittedDateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const statuses: AdminOrderStatus[] = ['new', 'received', 'preparing', 'ready', 'cancelled'];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const live = useRef<ReturnType<typeof subscribeOrderEvents> | null>(null);
  const writing = useRef(false);
  const hasSession = hasAdminSession();

  useEffect(() => {
    if (!hasSession) return;
    const subscription = subscribeOrderEvents(
      '/api/admin/orders/events',
      'orders-changed',
      getAdminOrders,
      (nextOrders) => {
        setOrders(nextOrders);
        setLoadError('');
        setLoading(false);
      },
      (ordersError) => {
        setLoadError(ordersError instanceof Error ? ordersError.message : 'Could not load recent orders.');
        setLoading(false);
        return ordersError instanceof ApiError && [401, 403].includes(ordersError.status);
      },
    );
    live.current = subscription;
    return () => { subscription.stop(); live.current = null; };
  }, [hasSession]);

  if (!hasSession) return <AdminLoginRequired />;

  async function handleStatusChange(orderId: string, nextStatus: AdminOrderStatus) {
    const subscription = live.current;
    if (!hasSession || !subscription || writing.current) return;
    writing.current = true;
    subscription.pause(); // invalidate reads started before this write
    setUpdatingId(orderId);
    setError('');
    try {
      const updated = await updateAdminOrderStatus(orderId, nextStatus);
      if (live.current !== subscription) return;
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status: updated.status, status_label: updated.status_label }
            : order,
        ),
      );
    } catch (statusError) {
      if (live.current !== subscription) return;
      setError(statusError instanceof Error ? statusError.message : 'Could not update this order.');
    } finally {
      writing.current = false;
      if (live.current === subscription) {
        setUpdatingId('');
        subscription.resume(); // reconcile after writes, including failed responses
      }
    }
  }

  return (
    <AdminLayout title="Orders" onLogout={() => { live.current?.stop(); live.current = null; }}>
      {error || loadError ? <p className="error-text">{error || loadError}</p> : null}
      {loading ? <section className="skeleton-card">Loading recent orders…</section> : null}
      {!loading && orders.length === 0 ? <section className="skeleton-card">No orders yet.</section> : null}
      {orders.length > 0 ? (
        <section className="admin-orders-list" aria-label="Recent admin orders">
          {orders.map((order) => (
            <article className="status-card admin-order-card" key={order.id} aria-label={`Order #${order.order_number} controls`}>
              <div>
                <p className="eyebrow">Order #{order.order_number}</p>
                <h2 className="brand-heading" dir="auto">{order.guest_name}</h2>
                <p className="detail-copy">
                  Submitted <time dateTime={order.created_at}>{submittedDateFormat.format(new Date(order.created_at))}</time>
                </p>
                <p className="detail-copy">{order.items_count === 1 ? '1 item' : `${order.items_count} items`}</p>
              </div>
              <p className="status-label brand-heading">{statusLabels[order.status]}</p>
              <label>
                Update status
                <select
                  value={order.status}
                  disabled={updatingId !== ''}
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
    </AdminLayout>
  );
}
