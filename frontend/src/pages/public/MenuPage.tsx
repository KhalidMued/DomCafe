import { useEffect, useMemo, useRef, useState } from 'react';

import { ApiError, getMenu, getOrderStatus, type OrderStatus, type PublicMenuCategory } from '../../lib/api';
import { addCartItem, getCartItems, subscribeCart } from '../../store/cartStore';
import { clearActiveOrderId, getActiveOrderId } from '../../store/orderProgressStore';

const finalOrderStatuses = new Set(['ready', 'cancelled']);
const orderProgressSteps = ['new', 'received', 'preparing', 'ready'];
const orderProgressLabels: Record<string, string> = {
  new: 'Sent',
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
};

export function MenuPage({ navigate }: { navigate: (path: string) => void }) {
  const [menu, setMenu] = useState<PublicMenuCategory[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(getCartItems().reduce((sum, item) => sum + item.quantity, 0));
  const [activeOrder, setActiveOrder] = useState<OrderStatus | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addedDrinkId, setAddedDrinkId] = useState<string | null>(null);
  const addedTimeout = useRef<number | null>(null);

  useEffect(() => {
    const menuNotice = window.sessionStorage.getItem('dom_menu_notice');
    if (menuNotice) {
      setNotice(menuNotice);
      window.sessionStorage.removeItem('dom_menu_notice');
    }
    getMenu()
      .then(setMenu)
      .catch(() => setError('We couldn’t load the menu right now. Please refresh or check with the coffee bar.'))
      .finally(() => setIsLoading(false));
    const unsubscribe = subscribeCart(() => setCartCount(getCartItems().reduce((sum, item) => sum + item.quantity, 0)));
    return () => {
      unsubscribe();
      if (addedTimeout.current) {
        window.clearTimeout(addedTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const orderId = getActiveOrderId();
    if (orderId === null) return undefined;
    const fetchOrderId: string = orderId;

    let alive = true;
    let timer: number | undefined;

    async function loadOrderProgress() {
      try {
        const nextOrder = await getOrderStatus(fetchOrderId);
        if (!alive) return;
        setActiveOrder(nextOrder);
        if (!finalOrderStatuses.has(nextOrder.status)) {
          timer = window.setTimeout(loadOrderProgress, 15_000);
        }
      } catch (orderError) {
        if (!alive) return;
        if (orderError instanceof ApiError && orderError.status === 404) {
          clearActiveOrderId(fetchOrderId);
          setActiveOrder(null);
          return;
        }
        // Transient failure: keep the card and try again on the next tick.
        timer = window.setTimeout(loadOrderProgress, 15_000);
      }
    }

    loadOrderProgress();

    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  function addDrink(drink: PublicMenuCategory['drinks'][number]) {
    addCartItem(drink);
    setAddedDrinkId(drink.id);
    if (addedTimeout.current) {
      window.clearTimeout(addedTimeout.current);
    }
    addedTimeout.current = window.setTimeout(() => setAddedDrinkId(null), 2000);
  }

  const categories = useMemo(() => menu.filter((category) => category.drinks.length > 0), [menu]);
  const drinkCount = categories.reduce((sum, category) => sum + category.drinks.length, 0);
  const drinkCountLabel = `${drinkCount} ${drinkCount === 1 ? 'drink' : 'drinks'}`;
  const sectionCountLabel = `${categories.length} ${categories.length === 1 ? 'section' : 'sections'}`;
  const progressIndex = activeOrder ? Math.max(orderProgressSteps.indexOf(activeOrder.status), 0) : -1;

  return (
    <main className="page-shell menu-page">
      <header className="top-bar menu-hero">
        <div>
          <p className="eyebrow">DŌM menu</p>
          <h1 className="brand-heading">Menu</h1>
          <p className="menu-lede">Choose your coffee, then review everything before it reaches the bar.</p>
        </div>
        <a className="cart-link cart-link-strong" href="/cart" onClick={(event) => { event.preventDefault(); navigate('/cart'); }}>Review order ({cartCount})</a>
      </header>

      {activeOrder ? (
        <section className="status-card menu-order-progress" aria-label={`Order #${activeOrder.order_number} progress`}>
          <div className="menu-order-progress-heading">
            <div>
              <p className="eyebrow">Your order</p>
              <h2 className="brand-heading">Order #{activeOrder.order_number}</h2>
            </div>
            <a href={`/order/${activeOrder.id}`} onClick={(event) => { event.preventDefault(); navigate(`/order/${activeOrder.id}`); }}>Details</a>
          </div>
          <p className="status-label brand-heading" dir="auto">{activeOrder.status_label}</p>
          <div className={activeOrder.status === 'cancelled' ? 'progress-track progress-track-cancelled' : 'progress-track'} aria-label={`Current status ${activeOrder.status}`}>
            {orderProgressSteps.map((status, index) => <span className={index <= progressIndex && activeOrder.status !== 'cancelled' ? 'active' : ''} key={status}>{orderProgressLabels[status]}</span>)}
          </div>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <nav className="category-tabs" aria-label="Menu categories">
          {categories.map((category) => <a key={category.id} href={`#${category.id}`} dir="auto">{category.name}</a>)}
        </nav>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}
      {notice ? <p className="menu-notice" aria-live="polite">{notice}</p> : null}
      {isLoading ? <div className="skeleton-card menu-empty-card">Preparing the menu…</div> : null}
      {!isLoading && !error && categories.length === 0 ? (
        <section className="skeleton-card menu-empty-card" aria-live="polite">
          <p className="eyebrow">Menu pause</p>
          <h2 className="brand-heading">No drinks are available right now.</h2>
          <p>The bar may be updating today’s menu. Please check again soon or ask the coffee bar.</p>
        </section>
      ) : null}

      {categories.length > 0 ? <p className="menu-count">{drinkCountLabel} across {sectionCountLabel}</p> : null}

      {categories.map((category) => (
        <section className="menu-section" id={category.id} key={category.id}>
          <div className="section-heading-row">
            <div>
              <h2 className="brand-heading" dir="auto">{category.name}</h2>
              {category.description ? <p dir="auto">{category.description}</p> : null}
            </div>
            <span>{category.drinks.length} {category.drinks.length === 1 ? 'drink' : 'drinks'}</span>
          </div>
          <div className="drink-grid">
            {category.drinks.map((drink) => (
              <article className="drink-card" key={drink.id}>
                <button className="drink-image-button" type="button" onClick={() => setExpanded(expanded === drink.id ? null : drink.id)} aria-label={`Show ${drink.name} details`}>
                  <img src={drink.photo_url} alt={drink.name} />
                </button>
                <div className="drink-content">
                  <div className="drink-title-row">
                    <h3 className="brand-heading" dir="auto">{drink.name}</h3>
                    {drink.estimated_time_minutes ? <span>{drink.estimated_time_minutes} min</span> : null}
                  </div>
                  <p dir="auto">{drink.description}</p>
                  <p className="bean-line">Bean: <span dir="auto">{drink.bean?.name ?? 'House selection'}</span></p>
                  <div className="option-row" aria-label={`${drink.name} options`}>
                    {drink.temperature_options.map((option) => <span key={option} dir="auto">{option}</span>)}
                    {drink.milk_options.map((option) => <span key={option} dir="auto">{option}</span>)}
                  </div>
                  {expanded === drink.id ? <p className="detail-copy" dir="auto">{drink.ingredients.join(', ') || 'Simple and quiet.'}</p> : null}
                  <button className={addedDrinkId === drink.id ? 'drink-add-button drink-add-button-added' : 'drink-add-button'} type="button" onClick={() => addDrink(drink)} aria-label={addedDrinkId === drink.id ? `${drink.name} added to order` : `Add ${drink.name}`}>{addedDrinkId === drink.id ? 'Order is Added' : 'Add to order'}</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
