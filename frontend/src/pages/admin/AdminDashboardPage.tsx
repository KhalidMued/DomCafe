export function AdminDashboardPage() {
  return (
    <main className="page-shell admin-page">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Admin dashboard</h1>
        </div>
      </section>
      <section className="status-card">
        <p className="status-label">You’re signed in.</p>
        <p className="detail-copy">Order cards and controls will arrive in the next Phase 4 slice.</p>
      </section>
    </main>
  );
}
