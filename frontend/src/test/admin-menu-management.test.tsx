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
      description: 'A cold espresso milk drink.',
      photo_url: '/uploads/drinks/placeholder.jpg',
      is_available: true,
      temperature_options: ['iced'],
      milk_options: ['whole milk', 'oat milk'],
      estimated_time_minutes: 5,
    },
  ],
  beans: [
    {
      id: 'dom-house-beans',
      name: 'DŌM House Beans',
      origin: 'Sudan',
      process: 'Natural',
      tasting_notes: ['date', 'cocoa'],
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

  it('uploads a replacement drink photo from the menu page', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const uploadResponse = {
      id: 'iced-doum-latte',
      photo_url: '/uploads/drinks/iced-doum-latte-new.jpg',
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/menu') return jsonResponse(menuPayload);
      expect(url).toBe('/api/admin/uploads/drink-photo');
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({ Authorization: 'Bearer admin-token' });
      expect(init?.body).toBeInstanceOf(FormData);
      const body = init?.body as FormData;
      expect(body.get('drink_id')).toBe('iced-doum-latte');
      expect((body.get('photo') as File).name).toBe('replacement.jpg');
      return jsonResponse(uploadResponse);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const drinkCard = await screen.findByLabelText('Iced Doum Latte controls');
    const file = new File(['replacement'], 'replacement.jpg', { type: 'image/jpeg' });
    fireEvent.change(within(drinkCard).getByLabelText('Replace photo'), { target: { files: [file] } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(within(drinkCard).getByAltText('Iced Doum Latte photo')).toHaveAttribute('src', uploadResponse.photo_url);
  });

  it('edits drink copy and options from the menu page', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const updatedDrink = {
      ...menuPayload.drinks[0],
      name: 'Iced DŌM Latte',
      description: 'Cold milk, espresso, and a quiet Doum finish.',
      temperature_options: ['iced'],
      milk_options: ['whole milk', 'oat milk', 'almond milk'],
      estimated_time_minutes: 6,
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/menu') return jsonResponse(menuPayload);
      expect(url).toBe('/api/admin/drinks/iced-doum-latte');
      expect(init?.method).toBe('PATCH');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer admin-token' });
      expect(init?.body).toBe(JSON.stringify({
        name: 'Iced DŌM Latte',
        description: 'Cold milk, espresso, and a quiet Doum finish.',
        temperature_options: ['iced'],
        milk_options: ['whole milk', 'oat milk', 'almond milk'],
        estimated_time_minutes: 6,
      }));
      return jsonResponse(updatedDrink);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const drinkCard = await screen.findByLabelText('Iced Doum Latte controls');
    fireEvent.click(within(drinkCard).getByRole('button', { name: 'Edit drink' }));
    fireEvent.change(within(drinkCard).getByLabelText('Drink name'), { target: { value: 'Iced DŌM Latte' } });
    fireEvent.change(within(drinkCard).getByLabelText('Description'), { target: { value: 'Cold milk, espresso, and a quiet Doum finish.' } });
    fireEvent.change(within(drinkCard).getByLabelText('Temperature options'), { target: { value: 'iced' } });
    fireEvent.change(within(drinkCard).getByLabelText('Milk options'), { target: { value: 'whole milk, oat milk, almond milk' } });
    fireEvent.change(within(drinkCard).getByLabelText('Estimated minutes'), { target: { value: '6' } });
    fireEvent.click(within(drinkCard).getByRole('button', { name: 'Save drink' }));

    expect(await within(drinkCard).findByText('Iced DŌM Latte')).toBeInTheDocument();
    expect(within(drinkCard).getByText('Cold milk, espresso, and a quiet Doum finish.')).toBeInTheDocument();
    expect(within(drinkCard).getByText('iced · whole milk, oat milk, almond milk · 6 min')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('edits bean details from the menu page', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const updatedBean = {
      ...menuPayload.beans[0],
      name: 'DŌM House Beans',
      origin: 'Sudan / Brazil',
      process: 'Natural washed blend',
      tasting_notes: ['date', 'cocoa', 'almond'],
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/menu') return jsonResponse(menuPayload);
      expect(url).toBe('/api/admin/beans/dom-house-beans');
      expect(init?.method).toBe('PATCH');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer admin-token' });
      expect(init?.body).toBe(JSON.stringify({
        name: 'DŌM House Beans',
        origin: 'Sudan / Brazil',
        process: 'Natural washed blend',
        tasting_notes: ['date', 'cocoa', 'almond'],
      }));
      return jsonResponse(updatedBean);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const beanCard = await screen.findByLabelText('DŌM House Beans controls');
    fireEvent.click(within(beanCard).getByRole('button', { name: 'Edit bean' }));
    fireEvent.change(within(beanCard).getByLabelText('Bean name'), { target: { value: 'DŌM House Beans' } });
    fireEvent.change(within(beanCard).getByLabelText('Origin'), { target: { value: 'Sudan / Brazil' } });
    fireEvent.change(within(beanCard).getByLabelText('Process'), { target: { value: 'Natural washed blend' } });
    fireEvent.change(within(beanCard).getByLabelText('Tasting notes'), { target: { value: 'date, cocoa, almond' } });
    fireEvent.click(within(beanCard).getByRole('button', { name: 'Save bean' }));

    expect(await within(beanCard).findByText('Sudan / Brazil')).toBeInTheDocument();
    expect(within(beanCard).getByText('Natural washed blend')).toBeInTheDocument();
    expect(within(beanCard).getByText('date, cocoa, almond')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('asks the admin to log in when no token is stored', () => {
    render(<App />);

    expect(screen.getByText('Admin login required.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute('href', '/admin/login');
  });
});
