import { useEffect, useMemo, useState } from 'react';

import { getMenu, type PublicMenuCategory } from '../../lib/api';
import { addCartItem, getCartItems, subscribeCart } from '../../store/cartStore';

export function MenuPage({ navigate }: { navigate: (path: string) => void }) {
  const [menu, setMenu] = useState<PublicMenuCategory[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(getCartItems().reduce((sum, item) => sum + item.quantity, 0));
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getMenu()
      .then(setMenu)
      .catch(() => setError('We couldn’t load the menu right now. Please refresh or check with the coffee bar.'))
      .finally(() => setIsLoading(false));
    const unsubscribe = subscribeCart(() => setCartCount(getCartItems().reduce((sum, item) => sum + item.quantity, 0)));
    return () => {
      unsubscribe();
    };
  }, []);

  const categories = useMemo(() => menu.filter((category) => category.drinks.length > 0), [menu]);
  const drinkCount = categories.reduce((sum, category) => sum + category.drinks.length, 0);
  const drinkCountLabel = `${drinkCount} ${drinkCount === 1 ? 'drink' : 'drinks'}`;
  const sectionCountLabel = `${categories.length} ${categories.length === 1 ? 'section' : 'sections'}`;

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

      {categories.length > 0 ? (
        <nav className="category-tabs" aria-label="Menu categories">
          {categories.map((category) => <a key={category.id} href={`#${category.id}`} dir="auto">{category.name}</a>)}
        </nav>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}
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
                  <img src={drink.photo_url} alt="" />
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
