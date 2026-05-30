import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
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
  window.history.pushState({}, '', '/admin/dashboard');
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Phase 4 admin dashboard summary', () => {
  it('loads dashboard counts with the stored admin token', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('/api/admin/dashboard');
      expect(init?.headers).toEqual({ Authorization: 'Bearer admin-token' });
      return jsonResponse({
        new_orders_count: 2,
        preparing_orders_count: 1,
        ready_orders_count: 3,
        orders_open: true,
        available_drinks_count: 22,
        available_beans_count: 1,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const summary = await screen.findByLabelText('Admin dashboard summary');
    expect(within(summary).getByText('2')).toBeInTheDocument();
    expect(within(summary).getByText('New orders')).toBeInTheDocument();
    expect(within(summary).getByText('Preparing')).toBeInTheDocument();
    expect(within(summary).getByText('3')).toBeInTheDocument();
    expect(within(summary).getByText('Ready')).toBeInTheDocument();
    expect(within(summary).getByText('Orders open')).toBeInTheDocument();
    expect(within(summary).getByText('22')).toBeInTheDocument();
    expect(within(summary).getByText('Available drinks')).toBeInTheDocument();
    expect(within(summary).getByText('Available beans')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('asks the admin to log in when no token is stored', () => {
    render(<App />);

    expect(screen.getByText('Admin login required.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute('href', '/admin/login');
  });
});
