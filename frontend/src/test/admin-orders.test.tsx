import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.pushState({}, '', '/admin/orders');
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Phase 4 admin orders page', () => {
  it('loads recent orders with the stored admin token', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('/api/admin/orders');
      expect(init?.headers).toEqual({ Authorization: 'Bearer admin-token' });
      return jsonResponse([
        {
          id: '18',
          order_number: 18,
          guest_name: 'Mona',
          status: 'new',
          status_label: 'Your order was sent to the bar.',
          items_count: 2,
          created_at: '2026-05-30T18:00:00Z',
        },
      ]);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const orders = await screen.findByLabelText('Recent admin orders');
    expect(within(orders).getByText('Order #18')).toBeInTheDocument();
    expect(within(orders).getByText('Mona')).toBeInTheDocument();
    expect(within(orders).getAllByText('New').length).toBeGreaterThan(0);
    expect(within(orders).getByText('2 items')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('updates an order status from the orders page', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === '/api/admin/orders') {
        return jsonResponse([
          {
            id: '18',
            order_number: 18,
            guest_name: 'Mona',
            status: 'new',
            status_label: 'Your order was sent to the bar.',
            items_count: 1,
            created_at: '2026-05-30T18:00:00Z',
          },
        ]);
      }
      expect(String(input)).toBe('/api/admin/orders/18/status');
      expect(init?.method).toBe('PATCH');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer admin-token' });
      expect(init?.body).toBe(JSON.stringify({ status: 'preparing' }));
      return jsonResponse({
        id: '18',
        order_number: 18,
        status: 'preparing',
        status_label: 'Your drink is being prepared.',
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const orderCard = await screen.findByLabelText('Order #18 controls');
    fireEvent.change(within(orderCard).getByLabelText('Update status'), { target: { value: 'preparing' } });

    expect(await within(orderCard).findByText('Preparing')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('asks the admin to log in when no token is stored', () => {
    render(<App />);

    expect(screen.getByText('Admin login required.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute('href', '/admin/login');
  });
});
