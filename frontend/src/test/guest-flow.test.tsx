import { cleanup, render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';
import { clearCart } from '../store/cartStore';

const menuPayload = [
  {
    id: 'espresso_bar',
    name: 'Espresso Bar',
    description: 'Espresso classics.',
    drinks: [
      {
        id: 'spanish_latte',
        name: 'Spanish Latte',
        description: 'A smooth espresso milk drink with a sweet finish.',
        ingredients: ['espresso', 'milk'],
        bean: { id: 'dom_house_bean', name: 'DŌM House Bean', origin: 'House', tasting_notes: [] },
        photo_url: '/uploads/drinks/placeholder.jpg',
        available: true,
        temperature_options: ['hot', 'iced'],
        milk_options: ['whole milk', 'oat milk'],
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

function mockFetch(
  settings = { cafe_name: 'DŌM', welcome_message: 'Welcome to DŌM. Take your time.', orders_open: true },
  menu = menuPayload,
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === '/api/settings/public') {
      return jsonResponse(settings);
    }
    if (url === '/api/menu') {
      return jsonResponse(menu);
    }
    if (url === '/api/orders' && init?.method === 'POST') {
      return jsonResponse({ order_id: '41', order_number: 41, status: 'new', message: 'Your order was sent to the bar.' }, { status: 201 });
    }
    if (url === '/api/orders/41') {
      return jsonResponse({
        id: '41',
        order_number: 41,
        guest_name: 'Ahmed',
        status: 'new',
        status_label: 'Your order was sent to the bar.',
        items: [{ drink_name: 'Spanish Latte', quantity: 1, temperature: 'iced', milk_option: 'whole milk', item_note: null, bean_name: 'DŌM House Bean', photo_url: '/uploads/drinks/placeholder.jpg' }],
        created_at: '2026-05-30T12:00:00Z',
      });
    }
    throw new Error(`Unhandled fetch ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
  window.scrollTo = vi.fn();
  clearCart();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Phase 3 guest frontend', () => {
  it('stores the guest name on the welcome page and opens the menu', async () => {
    mockFetch();
    render(<App />);

    expect(screen.getByRole('region', { name: 'DŌM Home Café' })).toBeInTheDocument();
    expect(await screen.findByText('Open today')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/your name/i), 'Ahmed');
    await userEvent.click(screen.getByRole('button', { name: /start/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument());
    expect(window.localStorage.getItem('dom_guest_name')).toBe('Ahmed');
  });

  it('keeps the polished welcome start action disabled while orders are paused', async () => {
    mockFetch({ cafe_name: 'DŌM', welcome_message: 'الطلبات متوقفة مؤقتاً.', orders_open: false });
    render(<App />);

    expect(await screen.findAllByText('Orders paused')).toHaveLength(2);
    expect(screen.getByText('الطلبات متوقفة مؤقتاً.')).toHaveAttribute('dir', 'auto');
    await userEvent.type(screen.getByLabelText(/your name/i), 'Ahmed');

    expect(screen.getByRole('button', { name: /orders paused/i })).toBeDisabled();
    expect(window.localStorage.getItem('dom_guest_name')).toBeNull();
  });

  it('shows the menu, adds a drink, and submits the cart', async () => {
    const fetchMock = mockFetch();
    window.localStorage.setItem('dom_guest_name', 'Ahmed');
    window.history.pushState({}, '', '/menu');
    render(<App />);

    await screen.findByText('Spanish Latte');
    expect(screen.getByText('1 drink across 1 section')).toBeInTheDocument();
    expect(screen.getByText('4 min')).toBeInTheDocument();
    expect(screen.getByText('1 drink')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show spanish latte details/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /add spanish latte/i }));
    expect(screen.getByRole('button', { name: /spanish latte added to order/i })).toHaveTextContent('Order is Added');
    await userEvent.click(screen.getByRole('link', { name: /review order/i }));

    const cart = await screen.findByTestId('cart-page');
    expect(within(cart).getByText('Spanish Latte')).toBeInTheDocument();
    expect(within(cart).getByText('One quiet check before your order reaches the bar.')).toBeInTheDocument();
    expect(within(cart).getByText('Guest')).toBeInTheDocument();
    expect(within(cart).getByText('Drinks')).toBeInTheDocument();
    expect(within(cart).queryByRole('spinbutton')).not.toBeInTheDocument();
    const decreaseButton = within(cart).getByRole('button', { name: /decrease spanish latte quantity/i });
    expect(decreaseButton).toBeDisabled();
    await userEvent.click(within(cart).getByRole('button', { name: /increase spanish latte quantity/i }));
    expect(within(cart).getByText('2×')).toBeInTheDocument();
    expect(decreaseButton).toBeEnabled();
    await userEvent.click(decreaseButton);
    expect(within(cart).getByText('1×')).toBeInTheDocument();
    expect(decreaseButton).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /submit order/i }));

    await waitFor(() => expect(screen.getByText(/order #41/i)).toBeInTheDocument());
    expect(screen.getByText('We’ll keep this page updated while your drink moves through the bar.')).toBeInTheDocument();
    expect(screen.getByText('For')).toBeInTheDocument();
    expect(screen.getByText('1 drink')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/orders', expect.objectContaining({ method: 'POST' }));
  });

  it('removes the last drink from the cart and returns to the menu with a notice', async () => {
    mockFetch();
    window.localStorage.setItem('dom_guest_name', 'Ahmed');
    window.history.pushState({}, '', '/menu');
    render(<App />);

    await screen.findByText('Spanish Latte');
    await userEvent.click(screen.getByRole('button', { name: /add spanish latte/i }));
    await userEvent.click(screen.getByRole('link', { name: /review order/i }));
    await userEvent.click(await screen.findByRole('button', { name: /remove/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument());
    expect(screen.getByText('Your order is empty. Add something to get started.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /review order \(0\)/i })).toBeInTheDocument();
  });

  it('shows submitted order progress above the menu and keeps polling it', async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetch();
    window.localStorage.setItem('dom_guest_name', 'Ahmed');
    window.localStorage.setItem('dom_active_order_id', '41');
    window.history.pushState({}, '', '/menu');
    render(<App />);
    await act(async () => {});

    const progress = screen.getByRole('region', { name: /order #41 progress/i });
    const categories = screen.getByRole('navigation', { name: /menu categories/i });
    expect(progress.compareDocumentPosition(categories) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(progress).getByText('Your order was sent to the bar.')).toBeInTheDocument();
    expect(within(progress).getByText('Sent')).toHaveClass('active');
    expect(within(progress).getByRole('link', { name: /details/i })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledWith('/api/orders/41', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('shows a polished empty cart state', async () => {
    mockFetch();
    window.localStorage.setItem('dom_guest_name', 'Ahmed');
    window.history.pushState({}, '', '/cart');
    render(<App />);

    expect(screen.getByRole('heading', { name: /your order is quiet for now/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse menu/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit order/i })).not.toBeInTheDocument();
  });

  it('shows a polished empty state when no drinks are available', async () => {
    mockFetch(undefined, []);
    window.localStorage.setItem('dom_guest_name', 'Ahmed');
    window.history.pushState({}, '', '/menu');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /no drinks are available right now/i })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /menu categories/i })).not.toBeInTheDocument();
  });

  it('polls the order status every 15 seconds and stops after unmount', async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetch();
    window.history.pushState({}, '', '/order/41');
    const { unmount } = render(<App />);

    await act(async () => {});
    expect(screen.getByText('Your order was sent to the bar.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/orders/41', expect.objectContaining({ signal: expect.any(AbortSignal) }));

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(2);

    unmount();
    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
