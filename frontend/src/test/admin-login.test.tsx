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
      expect(String(input)).toBe('/api/admin/login');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(String(init?.body))).toEqual({ username: 'admin', password: 'secret' });
      return jsonResponse({ access_token: 'admin-token', token_type: 'bearer' });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(window.localStorage.getItem('dom_admin_token')).toBe('admin-token'));
    expect(await screen.findByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
