import type { ReactNode } from 'react';

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/beans', label: 'Beans' },
  { href: '/admin/settings', label: 'Settings' },
];

export function AdminLoginRequired() {
  return (
    <main className="page-shell admin-page">
      <section className="status-card">
        <p className="status-label">Admin login required.</p>
        <a className="cart-link" href="/admin/login">Go to login</a>
      </section>
    </main>
  );
}

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const currentPath = window.location.pathname;

  function logout() {
    window.localStorage.removeItem('dom_admin_token');
    window.history.pushState({}, '', '/admin/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  return (
    <main className="page-shell admin-page">
      <section className="admin-shell-header" aria-label="Admin controls navigation">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>{title}</h1>
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          {adminLinks.map((link) => (
            <a
              aria-current={currentPath === link.href ? 'page' : undefined}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <button className="admin-logout-button" onClick={logout} type="button">Logout</button>
      </section>
      {children}
    </main>
  );
}
