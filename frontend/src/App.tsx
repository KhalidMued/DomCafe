import { useCallback, useEffect, useState } from 'react';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { CartPage } from './pages/public/CartPage';
import { MenuPage } from './pages/public/MenuPage';
import { OrderStatusPage } from './pages/public/OrderStatusPage';
import { WelcomePage } from './pages/public/WelcomePage';

function currentPath() {
  return window.location.pathname;
}

export function App() {
  const [path, setPath] = useState(currentPath());

  const navigate = useCallback((nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (path === '/admin/login') return <AdminLoginPage navigate={navigate} />;
  if (path === '/admin/dashboard') return <AdminDashboardPage />;
  if (path === '/admin/orders') return <AdminOrdersPage />;
  if (path === '/menu') return <MenuPage navigate={navigate} />;
  if (path === '/cart') return <CartPage navigate={navigate} />;
  if (path.startsWith('/order/')) return <OrderStatusPage orderId={path.split('/').pop() ?? ''} navigate={navigate} />;
  return <WelcomePage navigate={navigate} />;
}
