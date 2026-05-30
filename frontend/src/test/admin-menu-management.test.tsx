import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const menuPayload = {
  orders_open: true,
  drinks: [
    {
      id: 'iced-doum-latte',
      name: 'Iced Doum Latte',
      category_name: 'Signature',
      bean_name: 'DŌM House Beans',
      photo_url: '/uploads/drinks/placeholder.jpg',
      is_available: true,
    },
  ],
  beans: [
    {
      id: 'dom-house-beans',
      name: 'DŌM House Beans',
      origin: 'Sudan',
      is_available: true,
    },
  ],
};

beforeEach(() => {
  window.localStorage.clear();
  window.history.pushState({}, '', '/admin/menu');
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Phase 4 admin menu management page', () => {
  it('loads drinks, beans, and orders-open setting with the stored admin token', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('/api/admin/menu');
      expect(init?.headers).toEqual({ Authorization: 'Bearer admin-token' });
      return jsonResponse(menuPayload);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByText('Menu management')).toBeInTheDocument();
    expect(screen.getByText('Orders are open')).toBeInTheDocument();
    const drinks = screen.getByLabelText('Admin drinks management');
    expect(within(drinks).getByText('Iced Doum Latte')).toBeInTheDocument();
    expect(within(drinks).getByText('Signature')).toBeInTheDocument();
    const beans = screen.getByLabelText('Admin beans management');
    expect(within(beans).getByText('DŌM House Beans')).toBeInTheDocument();
    expect(within(beans).getByText('Sudan')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('toggles orders, drink, and bean availability', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/menu') return jsonResponse(menuPayload);
      expect(init?.method).toBe('PATCH');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer admin-token' });
      if (url === '/api/admin/menu/settings/orders-open') {
        expect(init?.body).toBe(JSON.stringify({ orders_open: false }));
        return jsonResponse({ orders_open: false });
      }
      if (url === '/api/admin/menu/drinks/iced-doum-latte') {
        expect(init?.body).toBe(JSON.stringify({ is_available: false }));
        return jsonResponse({ id: 'iced-doum-latte', is_available: false });
      }
      expect(url).toBe('/api/admin/menu/beans/dom-house-beans');
      expect(init?.body).toBe(JSON.stringify({ is_available: false }));
      return jsonResponse({ id: 'dom-house-beans', is_available: false });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Close orders' }));
    expect(await screen.findByText('Orders are closed')).toBeInTheDocument();

    const drinkCard = screen.getByLabelText('Iced Doum Latte controls');
    fireEvent.click(within(drinkCard).getByRole('button', { name: 'Mark unavailable' }));
    expect(await within(drinkCard).findByText('Unavailable')).toBeInTheDocument();

    const beanCard = screen.getByLabelText('DŌM House Beans controls');
    fireEvent.click(within(beanCard).getByRole('button', { name: 'Mark unavailable' }));
    expect(await within(beanCard).findByText('Unavailable')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  });

  it('asks the admin to log in when no token is stored', () => {
    render(<App />);

    expect(screen.getByText('Admin login required.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute('href', '/admin/login');
  });
});
