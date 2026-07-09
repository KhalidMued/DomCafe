import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';
import { addCartItem, clearCart } from '../store/cartStore';

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

function mockFetch() {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === '/api/settings/public') {
      return jsonResponse({ cafe_name: 'DŌM', welcome_message: 'Welcome to DŌM. Take your time.', orders_open: true });
    }
    if (url === '/api/menu') return jsonResponse(menuPayload);
    if (url === '/api/admin/dashboard') {
      return jsonResponse({
        new_orders_count: 0,
        preparing_orders_count: 0,
        ready_orders_count: 0,
        orders_open: true,
        available_drinks_count: 1,
        available_beans_count: 1,
      });
    }
    throw new Error(`Unhandled fetch ${url}`);
  }));
}

beforeEach(() => {
  window.localStorage.clear();
  document.cookie = 'dom_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  window.sessionStorage.clear();
  window.history.pushState({}, '', '/');
  window.scrollTo = vi.fn();
  clearCart();
  mockFetch();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('guest name validation', () => {
  it('shows a friendly message when Start is pressed without a name', async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Start' }));

    const input = screen.getByLabelText('Your name');
    expect(screen.getByText(/tell us your name/i)).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(window.location.pathname).toBe('/');
  });

  it('clears the message while typing and then starts normally', async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Start' }));
    expect(screen.getByText(/tell us your name/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Your name'), 'Ahmed');
    expect(screen.queryByText(/tell us your name/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(window.location.pathname).toBe('/menu');
  });
});

describe('/admin root route', () => {
  it('redirects to the login page when no admin token is stored', async () => {
    window.history.pushState({}, '', '/admin');

    render(<App />);

    expect(await screen.findByLabelText('Username')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/login');
  });

  it('redirects to the dashboard when an admin token is stored', async () => {
    document.cookie = 'dom_admin_session=1; path=/';
    window.history.pushState({}, '', '/admin');

    render(<App />);

    expect(await screen.findByText('Admin dashboard')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/dashboard');
  });
});

describe('floating review-order link on the menu', () => {
  it('appears only after scrolling with items in the cart, and opens the cart', async () => {
    addCartItem(menuPayload[0].drinks[0]);
    window.history.pushState({}, '', '/menu');

    render(<App />);
    await screen.findByText('Spanish Latte');

    expect(screen.getAllByRole('link', { name: /Review order \(1\)/ })).toHaveLength(1);

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    const links = screen.getAllByRole('link', { name: /Review order \(1\)/ });
    expect(links).toHaveLength(2);
    const floating = links.find((link) => link.className.includes('menu-cart-float'));
    expect(floating).toBeDefined();

    await userEvent.click(floating!);
    expect(window.location.pathname).toBe('/cart');
  });
});
