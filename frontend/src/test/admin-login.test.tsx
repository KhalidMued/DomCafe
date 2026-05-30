import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  window.history.pushState({}, '', '/admin/login');
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Phase 4 admin login frontend', () => {
  it('logs in an admin, stores the bearer token, and opens the dashboard shell', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/login') {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toEqual({ username: 'admin', password: 'secret' });
        return jsonResponse({ access_token: 'admin-token', token_type: 'bearer' });
      }
      if (url === '/api/admin/dashboard') {
        expect(init?.headers).toEqual({ Authorization: 'Bearer admin-token' });
        return jsonResponse({
          new_orders_count: 0,
          preparing_orders_count: 0,
          ready_orders_count: 0,
          orders_open: true,
          available_drinks_count: 0,
          available_beans_count: 0,
        });
      }
      throw new Error(`Unhandled fetch ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(window.localStorage.getItem('dom_admin_token')).toBe('admin-token'));
    expect(await screen.findByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/login', expect.objectContaining({ method: 'POST' }));
  });

  it('shows a friendly error when admin credentials are rejected', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ detail: 'Invalid username or password.' }, { status: 401 })));

    render(<App />);

    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Invalid username or password.')).toBeInTheDocument();
    expect(window.localStorage.getItem('dom_admin_token')).toBeNull();
  });
});
