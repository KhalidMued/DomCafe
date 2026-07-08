import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const settingsPayload = {
  cafe_name: 'DŌM',
  welcome_message: 'Welcome to DŌM. Take your time.',
  orders_open: true,
};

beforeEach(() => {
  window.localStorage.clear();
  document.cookie = 'dom_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  window.history.pushState({}, '', '/admin/settings');
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Phase 4 admin settings page', () => {
  it('loads and saves cafe settings with the stored admin token', async () => {
    document.cookie = 'dom_admin_session=1; path=/';
    const updated = {
      cafe_name: 'DŌM Home Café',
      welcome_message: 'Welcome in. Take your time.',
      orders_open: false,
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/settings' && !init?.method) {
        expect(init?.headers).toBeUndefined();
        return jsonResponse(settingsPayload);
      }
      expect(url).toBe('/api/admin/settings');
      expect(init?.method).toBe('PATCH');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(init?.body).toBe(JSON.stringify(updated));
      return jsonResponse(updated);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    fireEvent.change(await screen.findByLabelText('Cafe name'), { target: { value: 'DŌM Home Café' } });
    fireEvent.change(screen.getByLabelText('Welcome message'), { target: { value: 'Welcome in. Take your time.' } });
    fireEvent.click(screen.getByLabelText('Orders open'));
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(await screen.findByText('Settings saved.')).toBeInTheDocument();
    expect(screen.getByLabelText('Cafe name')).toHaveValue('DŌM Home Café');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('asks the admin to log in when no token is stored', () => {
    render(<App />);

    expect(screen.getByText('Admin login required.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute('href', '/admin/login');
  });
});
