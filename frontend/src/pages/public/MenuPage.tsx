import { useEffect, useMemo, useState } from 'react';

import { getMenu, type PublicMenuCategory } from '../../lib/api';
import { addCartItem, getCartItems, subscribeCart } from '../../store/cartStore';

export function MenuPage({ navigate }: { navigate: (path: string) => void }) {
  const [menu, setMenu] = useState<PublicMenuCategory[]>([]);
  const [error, setError] = useState('');
  const [cartCount, setCartCount] = useState(getCartItems().reduce((sum, item) => sum + item.quantity, 0));
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getMenu().then(setMenu).catch(() => setError('We couldn’t load the menu right now. Please refresh or check with the coffee bar.'));
    const unsubscribe = subscribeCart(() => setCartCount(getCartItems().reduce((sum, item) => sum + item.quantity, 0)));
    return () => {
      unsubscribe();
    };
  }, []);

  const categories = useMemo(() => menu.filter((category) => category.drinks.length > 0), [menu]);

  return (
    <main className="page-shell menu-page">
      <header className="top-bar">
        <div>
          <p className="eyebrow">DŌM menu</p>
          <h1>Menu</h1>
        </div>
        <a className="cart-link" href="/cart" onClick={(event) => { event.preventDefault(); navigate('/cart'); }}>Review order ({cartCount})</a>
      </header>

      <nav className="category-tabs" aria-label="Menu categories">
        {categories.map((category) => <a key={category.id} href={`#${category.id}`}>{category.name}</a>)}
      </nav>

      {error ? <p className="error-text">{error}</p> : null}
      {categories.length === 0 && !error ? <div className="skeleton-card">Preparing the menu…</div> : null}

      {categories.map((category) => (
        <section className="menu-section" id={category.id} key={category.id}>
          <h2>{category.name}</h2>
          {category.description ? <p>{category.description}</p> : null}
          <div className="drink-grid">
            {category.drinks.map((drink) => (
              <article className="drink-card" key={drink.id}>
                <button className="drink-image-button" type="button" onClick={() => setExpanded(expanded === drink.id ? null : drink.id)}>
                  <img src={drink.photo_url} alt="" />
                </button>
                <div className="drink-content">
                  <h3>{drink.name}</h3>
                  <p>{drink.description}</p>
                  <p className="bean-line">Bean: {drink.bean?.name ?? 'House selection'}</p>
                  <div className="option-row">
                    {drink.temperature_options.map((option) => <span key={option}>{option}</span>)}
                    {drink.milk_options.map((option) => <span key={option}>{option}</span>)}
                  </div>
                  {expanded === drink.id ? <p className="detail-copy">{drink.ingredients.join(', ') || 'Simple and quiet.'}</p> : null}
                  <button type="button" onClick={() => addCartItem(drink)} aria-label={`Add ${drink.name}`}>Add to order</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
