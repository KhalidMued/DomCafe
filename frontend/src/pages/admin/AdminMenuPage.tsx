import { useEffect, useState } from 'react';

import {
  getAdminMenu,
  updateAdminBeanAvailability,
  updateAdminDrinkAvailability,
  updateAdminOrdersOpen,
  uploadAdminDrinkPhoto,
  type AdminMenuManagement,
} from '../../lib/api';

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

export function AdminMenuPage() {
  const [menu, setMenu] = useState<AdminMenuManagement | null>(null);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const token = window.localStorage.getItem('dom_admin_token');

  useEffect(() => {
    if (!token) return;
    getAdminMenu(token).then(setMenu).catch((menuError) => {
      setError(menuError instanceof Error ? menuError.message : 'Could not load menu management.');
    });
  }, [token]);

  if (!token) return <AdminLoginRequired />;

  async function toggleOrdersOpen() {
    if (!token || !menu) return;
    setUpdatingId('orders-open');
    const updated = await updateAdminOrdersOpen(token, !menu.orders_open);
    setMenu({ ...menu, orders_open: updated.orders_open });
    setUpdatingId('');
  }

  async function toggleDrink(drinkId: string, nextValue: boolean) {
    if (!token || !menu) return;
    setUpdatingId(drinkId);
    const updated = await updateAdminDrinkAvailability(token, drinkId, nextValue);
    setMenu({ ...menu, drinks: menu.drinks.map((drink) => drink.id === drinkId ? { ...drink, is_available: updated.is_available } : drink) });
    setUpdatingId('');
  }

  async function toggleBean(beanId: string, nextValue: boolean) {
    if (!token || !menu) return;
    setUpdatingId(beanId);
    const updated = await updateAdminBeanAvailability(token, beanId, nextValue);
    setMenu({ ...menu, beans: menu.beans.map((bean) => bean.id === beanId ? { ...bean, is_available: updated.is_available } : bean) });
    setUpdatingId('');
  }

  async function replaceDrinkPhoto(drinkId: string, photo: File | undefined) {
    if (!token || !menu || !photo) return;
    setUpdatingId(`${drinkId}-photo`);
    const updated = await uploadAdminDrinkPhoto(token, drinkId, photo);
    setMenu({ ...menu, drinks: menu.drinks.map((drink) => drink.id === drinkId ? { ...drink, photo_url: updated.photo_url } : drink) });
    setUpdatingId('');
  }

  return (
    <main className="page-shell admin-page">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Menu management</h1>
        </div>
        <a href="/admin/dashboard">Dashboard</a>
      </section>
      {error ? <p className="error-text">{error}</p> : null}
      {!menu && !error ? <section className="skeleton-card">Loading menu management…</section> : null}
      {menu ? (
        <>
          <section className="status-card admin-menu-toolbar">
            <p className="status-label">{menu.orders_open ? 'Orders are open' : 'Orders are closed'}</p>
            <button disabled={updatingId === 'orders-open'} onClick={toggleOrdersOpen} type="button">
              {menu.orders_open ? 'Close orders' : 'Open orders'}
            </button>
          </section>
          <section className="admin-management-grid" aria-label="Admin drinks management">
            <h2>Drinks</h2>
            {menu.drinks.map((drink) => (
              <article className="status-card admin-menu-card" key={drink.id} aria-label={`${drink.name} controls`}>
                <img src={drink.photo_url} alt={`${drink.name} photo`} />
                <div>
                  <h3>{drink.name}</h3>
                  <p className="detail-copy">{drink.category_name}</p>
                  {drink.bean_name ? <p className="detail-copy">{drink.bean_name}</p> : null}
                  <p>{drink.is_available ? 'Available' : 'Unavailable'}</p>
                </div>
                <div className="admin-menu-actions">
                  <label>
                    Replace photo
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      disabled={updatingId === `${drink.id}-photo`}
                      onChange={(event) => replaceDrinkPhoto(drink.id, event.currentTarget.files?.[0])}
                      type="file"
                    />
                  </label>
                  <button disabled={updatingId === drink.id} onClick={() => toggleDrink(drink.id, !drink.is_available)} type="button">
                    {drink.is_available ? 'Mark unavailable' : 'Mark available'}
                  </button>
                </div>
              </article>
            ))}
          </section>
          <section className="admin-management-grid" aria-label="Admin beans management">
            <h2>Beans</h2>
            {menu.beans.map((bean) => (
              <article className="status-card admin-menu-card" key={bean.id} aria-label={`${bean.name} controls`}>
                <div>
                  <h3>{bean.name}</h3>
                  {bean.origin ? <p className="detail-copy">{bean.origin}</p> : null}
                  <p>{bean.is_available ? 'Available' : 'Unavailable'}</p>
                </div>
                <button disabled={updatingId === bean.id} onClick={() => toggleBean(bean.id, !bean.is_available)} type="button">
                  {bean.is_available ? 'Mark unavailable' : 'Mark available'}
                </button>
              </article>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}
