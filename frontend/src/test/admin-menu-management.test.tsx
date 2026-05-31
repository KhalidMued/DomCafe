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
  categories: [
    {
      id: 'signature',
      label: 'Signature',
      description: 'House drinks with a quiet Doum finish.',
      accent_color: '#BA7517',
      display_order: 1,
      is_available: true,
    },
    {
      id: 'cold-bar',
      label: 'Cold Bar',
      description: 'Cold coffee for long afternoons.',
      accent_color: '#5DCAA5',
      display_order: 2,
      is_available: true,
    },
  ],
  drinks: [
    {
      id: 'iced-doum-latte',
      name: 'Iced Doum Latte',
      category_id: 'signature',
      category_name: 'Signature',
      bean_id: 'dom-house-beans',
      bean_name: 'DŌM House Beans',
      description: 'A cold espresso milk drink.',
      ingredients: ['espresso', 'milk'],
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
    const categories = screen.getByLabelText('Admin categories management');
    expect(within(categories).getByText('Cold Bar')).toBeInTheDocument();
    expect(within(categories).getByText('Cold coffee for long afternoons.')).toBeInTheDocument();
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
        category_id: 'signature',
        default_bean_id: 'dom-house-beans',
        description: 'Cold milk, espresso, and a quiet Doum finish.',
        ingredients: ['espresso', 'milk'],
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

  it('edits drink catalog fields from the menu page', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const updatedDrink = {
      ...menuPayload.drinks[0],
      category_id: 'cold-bar',
      category_name: 'Cold Bar',
      bean_id: 'dom-house-beans',
      ingredients: ['espresso', 'milk', 'doum'],
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/menu') return jsonResponse(menuPayload);
      expect(url).toBe('/api/admin/drinks/iced-doum-latte');
      expect(init?.method).toBe('PATCH');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer admin-token' });
      expect(init?.body).toBe(JSON.stringify({
        name: 'Iced Doum Latte',
        category_id: 'cold-bar',
        default_bean_id: 'dom-house-beans',
        description: 'A cold espresso milk drink.',
        ingredients: ['espresso', 'milk', 'doum'],
        temperature_options: ['iced'],
        milk_options: ['whole milk', 'oat milk'],
        estimated_time_minutes: 5,
      }));
      return jsonResponse(updatedDrink);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const drinkCard = await screen.findByLabelText('Iced Doum Latte controls');
    fireEvent.click(within(drinkCard).getByRole('button', { name: 'Edit drink' }));
    fireEvent.change(within(drinkCard).getByLabelText('Category'), { target: { value: 'cold-bar' } });
    fireEvent.change(within(drinkCard).getByLabelText('Default bean'), { target: { value: 'dom-house-beans' } });
    fireEvent.change(within(drinkCard).getByLabelText('Ingredients'), { target: { value: 'espresso, milk, doum' } });
    fireEvent.click(within(drinkCard).getByRole('button', { name: 'Save drink' }));

    expect(await screen.findAllByText('Cold Bar')).toHaveLength(2);
    expect(screen.getByText('espresso, milk, doum')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('creates category, bean, and drink entries from the menu page', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const newCategory = {
      id: 'slow-bar',
      label: 'Slow Bar',
      description: 'Manual brews and quiet cups.',
      accent_color: '#8B5E34',
      display_order: 9,
      is_available: true,
    };
    const newBean = {
      id: 'ethiopia-guji',
      name: 'Ethiopia Guji',
      origin: 'Ethiopia',
      process: 'Natural',
      tasting_notes: ['berry', 'jasmine'],
      is_available: true,
    };
    const newDrink = {
      id: 'slow-doum-brew',
      name: 'Slow DŌM Brew',
      category_id: 'slow-bar',
      category_name: 'Slow Bar',
      bean_id: 'ethiopia-guji',
      bean_name: 'Ethiopia Guji',
      description: 'A slow filter with a soft Doum finish.',
      ingredients: ['filter coffee', 'doum'],
      photo_url: '/uploads/drinks/slow-doum-brew.jpg',
      is_available: true,
      temperature_options: ['hot'],
      milk_options: ['none'],
      estimated_time_minutes: 7,
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/menu') return jsonResponse(menuPayload);
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer admin-token' });
      if (url === '/api/admin/categories') {
        expect(init?.body).toBe(JSON.stringify({
          id: 'slow-bar',
          label: 'Slow Bar',
          description: 'Manual brews and quiet cups.',
          accent_color: '#8B5E34',
          display_order: 9,
        }));
        return jsonResponse(newCategory, { status: 201 });
      }
      if (url === '/api/admin/beans') {
        expect(init?.body).toBe(JSON.stringify({
          id: 'ethiopia-guji',
          name: 'Ethiopia Guji',
          origin: 'Ethiopia',
          process: 'Natural',
          tasting_notes: ['berry', 'jasmine'],
        }));
        return jsonResponse(newBean, { status: 201 });
      }
      expect(url).toBe('/api/admin/drinks');
      expect(init?.body).toBe(JSON.stringify({
        id: 'slow-doum-brew',
        name: 'Slow DŌM Brew',
        category_id: 'slow-bar',
        default_bean_id: 'ethiopia-guji',
        description: 'A slow filter with a soft Doum finish.',
        ingredients: ['filter coffee', 'doum'],
        photo_url: '/uploads/drinks/slow-doum-brew.jpg',
        temperature_options: ['hot'],
        milk_options: ['none'],
        estimated_time_minutes: 7,
      }));
      return jsonResponse(newDrink, { status: 201 });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Add category' }));
    fireEvent.change(screen.getByLabelText('New category id'), { target: { value: 'slow-bar' } });
    fireEvent.change(screen.getByLabelText('New category name'), { target: { value: 'Slow Bar' } });
    fireEvent.change(screen.getByLabelText('New category description'), { target: { value: 'Manual brews and quiet cups.' } });
    fireEvent.change(screen.getByLabelText('New category accent color'), { target: { value: '#8B5E34' } });
    fireEvent.change(screen.getByLabelText('New category display order'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create category' }));
    expect(await screen.findByLabelText('Slow Bar controls')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add bean' }));
    fireEvent.change(screen.getByLabelText('New bean id'), { target: { value: 'ethiopia-guji' } });
    fireEvent.change(screen.getByLabelText('New bean name'), { target: { value: 'Ethiopia Guji' } });
    fireEvent.change(screen.getByLabelText('New bean origin'), { target: { value: 'Ethiopia' } });
    fireEvent.change(screen.getByLabelText('New bean process'), { target: { value: 'Natural' } });
    fireEvent.change(screen.getByLabelText('New bean tasting notes'), { target: { value: 'berry, jasmine' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create bean' }));
    expect(await screen.findByLabelText('Ethiopia Guji controls')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add drink' }));
    fireEvent.change(screen.getByLabelText('New drink id'), { target: { value: 'slow-doum-brew' } });
    fireEvent.change(screen.getByLabelText('New drink name'), { target: { value: 'Slow DŌM Brew' } });
    fireEvent.change(screen.getByLabelText('New drink category'), { target: { value: 'slow-bar' } });
    fireEvent.change(screen.getByLabelText('New drink default bean'), { target: { value: 'ethiopia-guji' } });
    fireEvent.change(screen.getByLabelText('New drink description'), { target: { value: 'A slow filter with a soft Doum finish.' } });
    fireEvent.change(screen.getByLabelText('New drink ingredients'), { target: { value: 'filter coffee, doum' } });
    fireEvent.change(screen.getByLabelText('New drink photo URL'), { target: { value: '/uploads/drinks/slow-doum-brew.jpg' } });
    fireEvent.change(screen.getByLabelText('New drink temperature options'), { target: { value: 'hot' } });
    fireEvent.change(screen.getByLabelText('New drink milk options'), { target: { value: 'none' } });
    fireEvent.change(screen.getByLabelText('New drink estimated minutes'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create drink' }));

    expect(await screen.findByLabelText('Slow DŌM Brew controls')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  });

  it('archives catalog items from the menu page without hard delete wording', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/menu') return jsonResponse(menuPayload);
      expect(init?.method).toBe('DELETE');
      expect(init?.headers).toEqual({ Authorization: 'Bearer admin-token' });
      if (url === '/api/admin/categories/cold-bar') {
        return jsonResponse({ ...menuPayload.categories[1], is_available: false });
      }
      if (url === '/api/admin/drinks/iced-doum-latte') {
        return jsonResponse({ ...menuPayload.drinks[0], is_available: false });
      }
      expect(url).toBe('/api/admin/beans/dom-house-beans');
      return jsonResponse({ ...menuPayload.beans[0], is_available: false });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const categoryCard = await screen.findByLabelText('Cold Bar controls');
    fireEvent.click(within(categoryCard).getByRole('button', { name: 'Archive category' }));
    expect(await within(categoryCard).findByText('Unavailable')).toBeInTheDocument();

    const drinkCard = screen.getByLabelText('Iced Doum Latte controls');
    fireEvent.click(within(drinkCard).getByRole('button', { name: 'Archive drink' }));
    expect(await within(drinkCard).findByText('Unavailable')).toBeInTheDocument();

    const beanCard = screen.getByLabelText('DŌM House Beans controls');
    fireEvent.click(within(beanCard).getByRole('button', { name: 'Archive bean' }));
    expect(await within(beanCard).findByText('Unavailable')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  });

  it('edits category details from the menu page', async () => {
    window.localStorage.setItem('dom_admin_token', 'admin-token');
    const updatedCategory = {
      ...menuPayload.categories[1],
      label: 'Slow Cold Bar',
      description: 'Quiet iced coffee for warm afternoons.',
      accent_color: '#5DCAA5',
      display_order: 4,
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/menu') return jsonResponse(menuPayload);
      expect(url).toBe('/api/admin/categories/cold-bar');
      expect(init?.method).toBe('PATCH');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer admin-token' });
      expect(init?.body).toBe(JSON.stringify({
        label: 'Slow Cold Bar',
        description: 'Quiet iced coffee for warm afternoons.',
        accent_color: '#5DCAA5',
        display_order: 4,
      }));
      return jsonResponse(updatedCategory);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const categoryCard = await screen.findByLabelText('Cold Bar controls');
    fireEvent.click(within(categoryCard).getByRole('button', { name: 'Edit category' }));
    fireEvent.change(within(categoryCard).getByLabelText('Category name'), { target: { value: 'Slow Cold Bar' } });
    fireEvent.change(within(categoryCard).getByLabelText('Category description'), { target: { value: 'Quiet iced coffee for warm afternoons.' } });
    fireEvent.change(within(categoryCard).getByLabelText('Accent color'), { target: { value: '#5DCAA5' } });
    fireEvent.change(within(categoryCard).getByLabelText('Display order'), { target: { value: '4' } });
    fireEvent.click(within(categoryCard).getByRole('button', { name: 'Save category' }));

    expect(await within(categoryCard).findByText('Slow Cold Bar')).toBeInTheDocument();
    expect(within(categoryCard).getByText('Quiet iced coffee for warm afternoons.')).toBeInTheDocument();
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
