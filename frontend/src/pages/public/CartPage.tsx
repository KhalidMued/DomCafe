import { useState } from 'react';

import { createOrder } from '../../lib/api';
import { clearCart, getCartItems, getGuestName, updateCartItem } from '../../store/cartStore';

export function CartPage({ navigate }: { navigate: (path: string) => void }) {
  const [items, setItems] = useState(getCartItems());
  const [guestNote, setGuestNote] = useState('');
  const [error, setError] = useState('');
  const guestName = getGuestName();

  async function submitOrder() {
    if (!guestName || items.length === 0) {
      setError('We couldn’t send your order. Please try again.');
      return;
    }
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
    }
  }

  function update(drinkId: string, patch: Parameters<typeof updateCartItem>[1]) {
    updateCartItem(drinkId, patch);
    setItems([...getCartItems()]);
  }

  return (
    <main className="page-shell cart-page" data-testid="cart-page">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Review</p>
          <h1>Cart</h1>
        </div>
        <a href="/menu" onClick={(event) => { event.preventDefault(); navigate('/menu'); }}>Back to menu</a>
      </header>
      <p className="guest-line">For {guestName || 'your guest'}</p>
      {items.length === 0 ? <p>Your order is quiet for now.</p> : null}
      {items.map((item) => (
        <article className="cart-item" key={item.drink.id}>
          <h2>{item.drink.name}</h2>
          <label>Quantity<input type="number" min="1" max="10" value={item.quantity} onChange={(event) => update(item.drink.id, { quantity: Number(event.target.value) })} /></label>
          {item.drink.temperature_options.length > 0 ? <label>Temperature<select value={item.temperature} onChange={(event) => update(item.drink.id, { temperature: event.target.value })}>{item.drink.temperature_options.map((option) => <option key={option}>{option}</option>)}</select></label> : null}
          {item.drink.milk_options.length > 0 ? <label>Milk<select value={item.milk_option} onChange={(event) => update(item.drink.id, { milk_option: event.target.value })}>{item.drink.milk_options.map((option) => <option key={option}>{option}</option>)}</select></label> : null}
          <label>Note<input value={item.item_note ?? ''} onChange={(event) => update(item.drink.id, { item_note: event.target.value })} maxLength={200} /></label>
        </article>
      ))}
      <label className="full-label">Order note<textarea value={guestNote} onChange={(event) => setGuestNote(event.target.value)} maxLength={300} /></label>
      {error ? <p className="error-text">{error}</p> : null}
      <button type="button" disabled={items.length === 0} onClick={submitOrder}>Submit order</button>
    </main>
  );
}
