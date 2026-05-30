import { useEffect, useState } from 'react';

import { getOrderStatus, type OrderStatus } from '../../lib/api';

const finalStatuses = new Set(['ready', 'cancelled']);

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
        setOrder(nextOrder);
        setError('');
        if (!finalStatuses.has(nextOrder.status)) {
          timer = window.setTimeout(load, 15_000);
        }
      } catch {
        if (!alive) return;
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

  return (
    <main className="page-shell status-page">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Order status</p>
          <h1>{order ? `Order #${order.order_number}` : 'Order'}</h1>
        </div>
        <a href="/menu" onClick={(event) => { event.preventDefault(); navigate('/menu'); }}>Menu</a>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      {!order ? <div className="skeleton-card">Listening for your order…</div> : null}
      {order ? (
        <section className="status-card">
          <p className="status-label">{order.status_label}</p>
          <div className="progress-track" aria-label={`Current status ${order.status}`}>
            {['new', 'received', 'preparing', 'ready'].map((status) => <span className={status === order.status ? 'active' : ''} key={status}>{status}</span>)}
          </div>
          <p>For {order.guest_name}</p>
          {order.items.map((item) => (
            <article className="status-item" key={`${item.drink_name}-${item.quantity}`}>
              <strong>{item.quantity}× {item.drink_name}</strong>
              <span>{[item.temperature, item.milk_option, item.bean_name].filter(Boolean).join(' · ')}</span>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
