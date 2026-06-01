import { useState } from 'react';

import { createOrder } from '../../lib/api';
import { clearCart, getCartItems, getGuestName, updateCartItem } from '../../store/cartStore';

export function CartPage({ navigate }: { navigate: (path: string) => void }) {
  const [items, setItems] = useState(getCartItems());
  const [guestNote, setGuestNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const guestName = getGuestName();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  async function submitOrder() {
    if (!guestName || items.length === 0) {
      setError('We couldn’t send your order. Please try again.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await createOrder({
        guest_name: guestName,
        guest_note: guestNote || undefined,
        items: items.map((item) => ({
          drink_id: item.drink.id,
          quantity: item.quantity,
          temperature: item.temperature,
          milk_option: item.milk_option,
          item_note: item.item_note,
        })),
      });
      clearCart();
      navigate(`/order/${response.order_id}`);
    } catch {
      setError('We couldn’t send your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function update(drinkId: string, patch: Parameters<typeof updateCartItem>[1]) {
    updateCartItem(drinkId, patch);
    setItems([...getCartItems()]);
  }

  return (
    <main className="page-shell cart-page" data-testid="cart-page">
      <header className="top-bar cart-hero">
        <div>
          <p className="eyebrow">Review</p>
          <h1>Cart</h1>
          <p className="cart-lede">One quiet check before your order reaches the bar.</p>
        </div>
        <a href="/menu" onClick={(event) => { event.preventDefault(); navigate('/menu'); }}>Back to menu</a>
      </header>

      <section className="cart-summary-card" aria-label="Order summary">
        <div>
          <span>Guest</span>
          <strong dir="auto">{guestName || 'your guest'}</strong>
        </div>
        <div>
          <span>Drinks</span>
          <strong>{totalItems}</strong>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="skeleton-card cart-empty-card" aria-live="polite">
          <p className="eyebrow">No drinks yet</p>
          <h2>Your order is quiet for now.</h2>
          <p>Return to the menu and choose a drink when you are ready.</p>
          <a href="/menu" onClick={(event) => { event.preventDefault(); navigate('/menu'); }}>Browse menu</a>
        </section>
      ) : null}

      <div className="cart-items-list">
        {items.map((item) => (
          <article className="cart-item" key={item.drink.id}>
            <div className="cart-item-heading">
              <div>
                <p className="eyebrow">Drink</p>
                <h2 dir="auto">{item.drink.name}</h2>
              </div>
              <span>{item.quantity}×</span>
            </div>
            <div className="cart-control-grid">
              <label>Quantity<input type="number" min="1" max="10" value={item.quantity} onChange={(event) => update(item.drink.id, { quantity: Number(event.target.value) })} /></label>
              {item.drink.temperature_options.length > 0 ? <label>Temperature<select value={item.temperature} onChange={(event) => update(item.drink.id, { temperature: event.target.value })}>{item.drink.temperature_options.map((option) => <option key={option}>{option}</option>)}</select></label> : null}
              {item.drink.milk_options.length > 0 ? <label>Milk<select value={item.milk_option} onChange={(event) => update(item.drink.id, { milk_option: event.target.value })}>{item.drink.milk_options.map((option) => <option key={option}>{option}</option>)}</select></label> : null}
            </div>
            <label>Note<input value={item.item_note ?? ''} onChange={(event) => update(item.drink.id, { item_note: event.target.value })} maxLength={200} dir="auto" /></label>
          </article>
        ))}
      </div>

      {items.length > 0 ? (
        <>
          <label className="full-label">Order note<textarea value={guestNote} onChange={(event) => setGuestNote(event.target.value)} maxLength={300} dir="auto" /></label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="submit-order-button" type="button" disabled={isSubmitting} onClick={submitOrder}>{isSubmitting ? 'Sending order…' : 'Submit order'}</button>
        </>
      ) : null}
    </main>
  );
}
