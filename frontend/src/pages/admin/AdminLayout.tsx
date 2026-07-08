import type { MouseEvent, ReactNode } from 'react';

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/beans', label: 'Beans' },
  { href: '/admin/settings', label: 'Settings' },
];

// App.tsx re-renders on popstate; pushing state and dispatching the event
// gives SPA navigation without threading navigate through every admin page.
function spaNavigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
  event.preventDefault();
  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function AdminWordmark() {
  return (
    <span className="admin-wordmark" aria-label="DŌM">
      D
      <span className="admin-wordmark-o" aria-hidden="true">
        O
        <span className="admin-wordmark-macron" />
      </span>
      M
    </span>
  );
}

export function AdminLoginRequired() {
  return (
    <main className="page-shell admin-page">
      <section className="status-card">
        <p className="status-label brand-heading">Admin login required.</p>
        <a className="cart-link" href="/admin/login" onClick={(event) => spaNavigate(event, '/admin/login')}>Go to login</a>
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
      <header className="admin-top-nav" aria-label="Admin controls navigation">
        <div className="admin-top-brand">
          <span className="admin-top-label">Admin</span>
          <AdminWordmark />
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          {adminLinks.map((link) => (
            <a
              aria-current={currentPath === link.href ? 'page' : undefined}
              href={link.href}
              key={link.href}
              onClick={(event) => spaNavigate(event, link.href)}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <button className="admin-logout-link" onClick={logout} type="button">Logout</button>
      </header>
      <h1 className="admin-page-title brand-heading">{title}</h1>
      {children}
    </main>
  );
}
