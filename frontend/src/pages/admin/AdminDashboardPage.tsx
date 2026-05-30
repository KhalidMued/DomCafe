import { useEffect, useState } from 'react';

import { getAdminDashboard, type AdminDashboardSummary } from '../../lib/api';

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="status-card admin-summary-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

export function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [error, setError] = useState('');
  const token = window.localStorage.getItem('dom_admin_token');

  useEffect(() => {
    if (!token) return;
    getAdminDashboard(token).then(setSummary).catch((dashboardError) => {
      setError(dashboardError instanceof Error ? dashboardError.message : 'Could not load the dashboard.');
    });
  }, [token]);

  if (!token) {
    return (
      <main className="page-shell admin-page">
        <section className="status-card">
          <p className="status-label">Admin login required.</p>
          <a className="cart-link" href="/admin/login">Go to login</a>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell admin-page">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Admin dashboard</h1>
        </div>
        <a href="/admin/orders">Orders</a>
      </section>
      {error ? <p className="error-text">{error}</p> : null}
      {!summary && !error ? <section className="skeleton-card">Loading dashboard…</section> : null}
      {summary ? (
        <section className="admin-summary-grid" aria-label="Admin dashboard summary">
          <SummaryCard label="New orders" value={summary.new_orders_count} />
          <SummaryCard label="Preparing" value={summary.preparing_orders_count} />
          <SummaryCard label="Ready" value={summary.ready_orders_count} />
          <SummaryCard label={summary.orders_open ? 'Orders open' : 'Orders closed'} value={summary.orders_open ? 'Open' : 'Closed'} />
          <SummaryCard label="Available drinks" value={summary.available_drinks_count} />
          <SummaryCard label="Available beans" value={summary.available_beans_count} />
        </section>
      ) : null}
    </main>
  );
}
