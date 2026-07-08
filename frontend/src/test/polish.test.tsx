import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';
import { clearCart } from '../store/cartStore';

const menuPayload = [
  {
    id: 'espresso_bar',
    name: 'Espresso Bar',
    description: 'Espresso classics.',
    drinks: [
      {
        id: 'spanish_latte',
        name: 'Spanish Latte',
        description: 'A smooth espresso milk drink.',
        ingredients: ['espresso', 'milk'],
        bean: null,
        photo_url: '/uploads/drinks/placeholder.jpg',
        available: true,
        temperature_options: ['hot'],
        milk_options: [],
        estimated_time_minutes: 4,
      },
    ],
  },
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
});

describe('cancelled order presentation', () => {
  it('shows the cancelled track without active steps on the status page', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/orders/abc123') {
        return jsonResponse({
          id: 'abc123',
          order_number: 12,
          guest_name: 'Ahmed',
          status: 'cancelled',
          status_label: 'This order was cancelled. Please check with the coffee bar.',
          items: [{ drink_name: 'Spanish Latte', quantity: 1, temperature: 'hot', milk_option: null, item_note: null, bean_name: null, photo_url: null }],
          created_at: '2026-07-08T12:00:00Z',
        });
      }
      throw new Error(`Unhandled fetch ${url}`);
    }));
    window.history.pushState({}, '', '/order/abc123');

    render(<App />);
    await screen.findByText('This order was cancelled. Please check with the coffee bar.');

    const track = screen.getByLabelText('Current status cancelled');
    expect(track.className).toContain('progress-track-cancelled');
    expect(track.querySelectorAll('.active')).toHaveLength(0);
  });
});

describe('menu accessibility', () => {
  it('gives drink photos the drink name as alt text', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/menu') return jsonResponse(menuPayload);
      throw new Error(`Unhandled fetch ${url}`);
    }));
    window.history.pushState({}, '', '/menu');

    render(<App />);

    expect(await screen.findByAltText('Spanish Latte')).toBeInTheDocument();
  });
});

describe('admin SPA navigation', () => {
  it('navigates to the login page without a full reload', async () => {
    window.history.pushState({}, '', '/admin/dashboard');

    render(<App />);
    const loginLink = await screen.findByRole('link', { name: 'Go to login' });
    await userEvent.click(loginLink);

    expect(window.location.pathname).toBe('/admin/login');
    expect(await screen.findByLabelText('Username')).toBeInTheDocument();
  });
});
