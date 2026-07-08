import { useEffect, useState } from 'react';

import { ApiError, getOrderStatus, type OrderStatus } from '../../lib/api';
import { clearActiveOrderId, setActiveOrderId } from '../../store/orderProgressStore';

const finalStatuses = new Set(['ready', 'cancelled']);
const statusSteps = ['new', 'received', 'preparing', 'ready'];

export function OrderStatusPage({ orderId, navigate }: { orderId: string; navigate: (path: string) => void }) {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;

    async function load() {
      try {
        const nextOrder = await getOrderStatus(orderId);
        if (!alive) return;
        setActiveOrderId(orderId);
        setOrder(nextOrder);
        setError('');
        if (!finalStatuses.has(nextOrder.status)) {
          timer = window.setTimeout(load, 15_000);
        }
      } catch (statusError) {
        if (!alive) return;
        if (statusError instanceof ApiError && statusError.status === 404) {
          clearActiveOrderId(orderId);
          setError('We could not find that order. Please check with the coffee bar.');
          return;
        }
        setError('We’re having trouble refreshing your order status. We’ll try again shortly.');
        timer = window.setTimeout(load, 15_000);
      }
    }

    load();
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [orderId]);

  const activeIndex = order ? Math.max(statusSteps.indexOf(order.status), 0) : -1;

  return (
    <main className="page-shell status-page">
      <header className="top-bar status-hero">
        <div>
          <p className="eyebrow">Order status</p>
          <h1 className="brand-heading">{order ? `Order #${order.order_number}` : 'Order'}</h1>
          <p className="status-lede">We’ll keep this page updated while your drink moves through the bar.</p>
        </div>
        <a href="/menu" onClick={(event) => { event.preventDefault(); navigate('/menu'); }}>Menu</a>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      {!order ? <div className="skeleton-card status-loading-card">Listening for your order…</div> : null}
      {order ? (
        <section className="status-card status-detail-card">
          <div className="status-card-topline">
            <span>For <strong dir="auto">{order.guest_name}</strong></span>
            <span>{order.items.length} {order.items.length === 1 ? 'drink' : 'drinks'}</span>
          </div>
          <p className="status-label brand-heading" dir="auto">{order.status_label}</p>
          <div className={order.status === 'cancelled' ? 'progress-track progress-track-cancelled' : 'progress-track'} aria-label={`Current status ${order.status}`}>
            {statusSteps.map((status, index) => <span className={index <= activeIndex && order.status !== 'cancelled' ? 'active' : ''} key={status}>{status}</span>)}
          </div>
          <div className="status-items-list">
            {order.items.map((item, index) => (
              <article className="status-item" key={`${item.drink_name}-${index}`}>
                <strong dir="auto">{item.quantity}× {item.drink_name}</strong>
                <span dir="auto">{[item.temperature, item.milk_option, item.bean_name].filter(Boolean).join(' · ')}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
