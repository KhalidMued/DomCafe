import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';
import type { PublicDrink } from '../lib/api';
import { ApiError, getMenu } from '../lib/api';
import { addCartItem, clearCart, getCartItems } from '../store/cartStore';

const drink: PublicDrink = {
  id: 'spanish_latte',
  name: 'Spanish Latte',
  description: 'A smooth espresso milk drink with a sweet finish.',
  ingredients: ['espresso', 'milk'],
  bean: { id: 'dom_house_bean', name: 'DŌM House Bean', origin: 'House', tasting_notes: [] },
  photo_url: '/uploads/drinks/placeholder.jpg',
  available: true,
  temperature_options: ['hot', 'iced'],
  milk_options: ['whole milk', 'oat milk'],
  estimated_time_minutes: 4,
};

const menuPayload = [
  { id: 'espresso_bar', name: 'Espresso Bar', description: 'Espresso classics.', drinks: [drink] },
];

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.pushState({}, '', '/');
  window.scrollTo = vi.fn();
  clearCart();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('api error handling', () => {
  it('turns a non-JSON 429 response into a friendly ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response('<html><body>429 Too Many Requests</body></html>', {
        status: 429,
        headers: { 'Content-Type': 'text/html' },
      }),
    ));

    await expect(getMenu()).rejects.toMatchObject({
      name: 'ApiError',
      status: 429,
      message: 'Please slow down a moment, then try again.',
    });
  });

  it('exposes the HTTP status on JSON error responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      jsonResponse({ error: true, code: 'ORDER_NOT_FOUND', message: 'We could not find that order.' }, { status: 404 }),
    ));

    const failure = await getMenu().catch((error) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure.status).toBe(404);
    expect(failure.message).toBe('We could not find that order.');
  });
});

describe('cart persistence and limits', () => {
  it('persists cart items to sessionStorage and restores them on reload', async () => {
    addCartItem(drink);
    addCartItem(drink);

    const stored = JSON.parse(window.sessionStorage.getItem('dom_cart_items') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].quantity).toBe(2);

    vi.resetModules();
    const freshStore = await import('../store/cartStore');
    expect(freshStore.getCartItems()).toHaveLength(1);
    expect(freshStore.getCartItems()[0].quantity).toBe(2);
  });

  it('caps a drink quantity at the backend maximum of 10', () => {
    for (let i = 0; i < 15; i += 1) {
      addCartItem(drink);
    }

    expect(getCartItems()[0].quantity).toBe(10);
  });
});

describe('active order progress resilience', () => {
  function mockMenuAndOrder(orderResponse: () => Response) {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/menu') return jsonResponse(menuPayload);
      if (url.startsWith('/api/orders/')) return orderResponse();
      throw new Error(`Unhandled fetch ${url}`);
    }));
  }

  it('keeps the stored active order when a status poll fails transiently', async () => {
    window.localStorage.setItem('dom_active_order_id', 'k3TqX9-w2ZbYpLmA');
    mockMenuAndOrder(() => new Response('<html>gateway error</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }));
    window.history.pushState({}, '', '/menu');

    render(<App />);
    await screen.findByText('Spanish Latte');

    expect(window.localStorage.getItem('dom_active_order_id')).toBe('k3TqX9-w2ZbYpLmA');
  });

  it('clears the stored active order when the backend confirms it is gone', async () => {
    window.localStorage.setItem('dom_active_order_id', 'k3TqX9-w2ZbYpLmA');
    mockMenuAndOrder(() => jsonResponse({ error: true, code: 'ORDER_NOT_FOUND', message: 'We could not find that order.' }, { status: 404 }));
    window.history.pushState({}, '', '/menu');

    render(<App />);
    await screen.findByText('Spanish Latte');

    await waitFor(() => {
      expect(window.localStorage.getItem('dom_active_order_id')).toBeNull();
    });
  });
});
