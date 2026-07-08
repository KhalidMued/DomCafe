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
  categories: [],
  drinks: [],
  beans: [
    {
      id: 'dom-house-beans',
      name: 'DŌM House Beans',
      origin: 'Sudan',
      process: 'Washed',
      tasting_notes: ['cocoa', 'date'],
      is_available: true,
    },
  ],
};

beforeEach(() => {
  window.localStorage.clear();
  document.cookie = 'dom_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  window.history.pushState({}, '', '/admin/dashboard');
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('admin navigation usability', () => {
  it('shows admin navigation and logout on protected admin pages', async () => {
    document.cookie = 'dom_admin_session=1; path=/';
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      new_orders_count: 0,
      preparing_orders_count: 0,
      ready_orders_count: 0,
      orders_open: true,
      available_drinks_count: 0,
      available_beans_count: 1,
    })));

    render(<App />);

    const nav = await screen.findByRole('navigation', { name: 'Admin sections' });
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/admin/dashboard');
    expect(within(nav).getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/admin/orders');
    expect(within(nav).getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/admin/menu');
    expect(within(nav).getByRole('link', { name: 'Beans' })).toHaveAttribute('href', '/admin/beans');
    expect(within(nav).getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/admin/settings');
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('logs out through the API and redirects to admin login', async () => {
    document.cookie = 'dom_admin_session=1; path=/';
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/admin/logout') {
        // jsdom's stubbed fetch can't apply Set-Cookie; mirror the browser here.
        document.cookie = 'dom_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        return jsonResponse({ ok: true });
      }
      return jsonResponse({
        new_orders_count: 0,
        preparing_orders_count: 0,
        ready_orders_count: 0,
        orders_open: true,
        available_drinks_count: 0,
        available_beans_count: 1,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Logout' }));

    expect(await screen.findByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/login');
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/logout', expect.objectContaining({ method: 'POST' }));
    expect(document.cookie).not.toContain('dom_admin_session=1');
  });

  it('loads beans at /admin/beans from the existing admin menu API', async () => {
    document.cookie = 'dom_admin_session=1; path=/';
    window.history.pushState({}, '', '/admin/beans');
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('/api/admin/menu');
      expect(init?.headers).toBeUndefined();
      return jsonResponse(menuPayload);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const beans = await screen.findByLabelText('Admin beans management');
    expect(within(beans).getByText('DŌM House Beans')).toBeInTheDocument();
    expect(within(beans).getByText('Sudan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add bean' })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
