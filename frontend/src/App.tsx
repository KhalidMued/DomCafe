import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { WelcomePage } from './pages/public/WelcomePage';

const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })));
const AdminMenuPage = lazy(() => import('./pages/admin/AdminMenuPage').then((module) => ({ default: module.AdminMenuPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then((module) => ({ default: module.AdminOrdersPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then((module) => ({ default: module.AdminSettingsPage })));
const CartPage = lazy(() => import('./pages/public/CartPage').then((module) => ({ default: module.CartPage })));
const MenuPage = lazy(() => import('./pages/public/MenuPage').then((module) => ({ default: module.MenuPage })));
const OrderStatusPage = lazy(() => import('./pages/public/OrderStatusPage').then((module) => ({ default: module.OrderStatusPage })));

function currentPath() {
  return window.location.pathname;
}

function RouteLoading() {
  return (
    <main className="app-route-loading" role="status" aria-live="polite">
      <div>
        <strong>DŌM</strong>
        <span>Loading</span>
      </div>
    </main>
  );
}

function CurrentRoute({ path, navigate }: { path: string; navigate: (nextPath: string) => void }) {
  if (path === '/admin/login') return <AdminLoginPage navigate={navigate} />;
  if (path === '/admin/dashboard') return <AdminDashboardPage />;
  if (path === '/admin/menu') return <AdminMenuPage />;
  if (path === '/admin/orders') return <AdminOrdersPage />;
  if (path === '/admin/settings') return <AdminSettingsPage />;
  if (path === '/menu') return <MenuPage navigate={navigate} />;
  if (path === '/cart') return <CartPage navigate={navigate} />;
  if (path.startsWith('/order/')) return <OrderStatusPage orderId={path.split('/').pop() ?? ''} navigate={navigate} />;
  return <WelcomePage navigate={navigate} />;
}

export function App() {
  const [path, setPath] = useState(currentPath());

  const navigate = useCallback((nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <Suspense fallback={<RouteLoading />}>
      <CurrentRoute path={path} navigate={navigate} />
    </Suspense>
  );
}
