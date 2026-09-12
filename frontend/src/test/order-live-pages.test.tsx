import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, adminLogout, getAdminOrders, getMenu, getOrderStatus, updateAdminOrderStatus } from '../lib/api';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { MenuPage } from '../pages/public/MenuPage';
import { OrderStatusPage } from '../pages/public/OrderStatusPage';

vi.mock('../lib/api', async (original) => ({
  ...await original<typeof import('../lib/api')>(),
  getAdminOrders: vi.fn(), getMenu: vi.fn(), getOrderStatus: vi.fn(),
  updateAdminOrderStatus: vi.fn(), adminLogout: vi.fn(),
}));
class FakeEventSource extends EventTarget {
  static instances: FakeEventSource[] = [];
  close = vi.fn();
  constructor(public url: string) { super(); FakeEventSource.instances.push(this); }
  emit(name: string) { this.dispatchEvent(new MessageEvent(name, { data: '{}' })); }
}
const guest = (status = 'new') => ({
  id: 'public/code?', order_number: 18, guest_name: 'Mona', status, status_label: `Guest ${status}`,
  items: [], created_at: '2026-05-30T18:00:00Z',
});
const admin = (status: 'new' | 'preparing' | 'ready' = 'new') => ({
  id: '18', order_number: 18, guest_name: 'Mona', status, status_label: status,
  items_count: 1, created_at: '2026-05-30T18:00:00Z',
});
const flush = async () => { await act(async () => {}); };
const emit = async (name: string) => { await act(async () => { FakeEventSource.instances[0].emit(name); }); };
const tick = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(15_000); }); };
beforeEach(() => {
  vi.useFakeTimers(); vi.resetAllMocks();
  FakeEventSource.instances = [];
  vi.stubGlobal('EventSource', FakeEventSource);
  localStorage.clear();
  document.cookie = 'dom_admin_session=1; path=/';
  vi.mocked(getMenu).mockResolvedValue([]);
  vi.mocked(getOrderStatus).mockResolvedValue(guest());
  vi.mocked(getAdminOrders).mockResolvedValue([admin()]);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe.each(['status', 'menu'])('%s guest live progress', (page) => {
  function mount() {
    localStorage.setItem('dom_active_order_id', 'public/code?');
    return render(page === 'status' ? <OrderStatusPage orderId="public/code?" navigate={vi.fn()} /> : <MenuPage navigate={vi.fn()} />);
  }
  it('uses the encoded public stream and refetches on events/reconnect; cleans up', async () => {
    const view = mount(); await flush();
    expect(FakeEventSource.instances[0].url).toBe('/api/orders/public%2Fcode%3F/events');
    await emit('connected');
    vi.mocked(getOrderStatus).mockResolvedValue(guest('preparing'));
    await emit('order-changed');
    expect(screen.getByText('Guest preparing')).toBeInTheDocument();
    await tick(); expect(getOrderStatus).toHaveBeenCalledTimes(3);
    await emit('error'); await tick(); expect(getOrderStatus).toHaveBeenCalledTimes(4);
    await emit('connected'); expect(getOrderStatus).toHaveBeenCalledTimes(5);
    view.unmount();
    expect(FakeEventSource.instances[0].close).toHaveBeenCalledOnce();
    await tick(); expect(getOrderStatus).toHaveBeenCalledTimes(5);
  });
  it.each(['ready', 'cancelled'])('stops the stream and polling at %s', async (status) => {
    mount(); await flush(); await emit('connected');
    vi.mocked(getOrderStatus).mockResolvedValue(guest(status));
    await emit('order-changed');
    expect(screen.getByText(`Guest ${status}`)).toBeInTheDocument();
    expect(FakeEventSource.instances[0].close).toHaveBeenCalledOnce();
    await tick(); expect(getOrderStatus).toHaveBeenCalledTimes(3);
  });
  it('closes and clears the active identifier on 404', async () => {
    mount(); await flush();
    vi.mocked(getOrderStatus).mockRejectedValue(new ApiError(404, 'missing'));
    await emit('connected');
    expect(localStorage.getItem('dom_active_order_id')).toBeNull();
    expect(FakeEventSource.instances[0].close).toHaveBeenCalledOnce();
    expect(screen.queryByText('Guest new')).not.toBeInTheDocument();
    if (page === 'status') expect(screen.getByText('We could not find that order. Please check with the coffee bar.')).toBeInTheDocument();
    await tick(); expect(getOrderStatus).toHaveBeenCalledTimes(2);
  });
  it('retains progress on transient read failure and retries without needing another event', async () => {
    mount(); await flush(); await emit('connected');
    vi.mocked(getOrderStatus).mockRejectedValueOnce(new Error('temporary'));
    await emit('order-changed');
    expect(screen.getByText('Guest new')).toBeInTheDocument();
    if (page === 'status') expect(screen.getByText('We’re having trouble refreshing your order status. We’ll try again shortly.')).toBeInTheDocument();
    vi.mocked(getOrderStatus).mockResolvedValue(guest('preparing'));
    await tick();
    expect(screen.getByText('Guest preparing')).toBeInTheDocument();
    await tick(); expect(getOrderStatus).toHaveBeenCalledTimes(4);
  });
});

it('does not subscribe to guest progress without an active menu order', async () => {
  render(<MenuPage navigate={vi.fn()} />); await flush();
  expect(getOrderStatus).not.toHaveBeenCalled();
  expect(FakeEventSource.instances).toHaveLength(0);
});

it('admin stream refreshes the list and preserves the original submitted timestamp', async () => {
  render(<AdminOrdersPage />); await flush();
  expect(FakeEventSource.instances[0].url).toBe('/api/admin/orders/events');
  await emit('connected');
  vi.mocked(getAdminOrders).mockResolvedValue([admin('ready')]);
  await emit('orders-changed');
  expect(screen.getByRole('combobox')).toHaveValue('ready');
  expect(document.querySelector('time')).toHaveAttribute('datetime', '2026-05-30T18:00:00Z');
  await tick(); expect(getAdminOrders).toHaveBeenCalledTimes(3);
});

it('admin stream closes immediately on logout, even while logout REST is pending', async () => {
  vi.mocked(adminLogout).mockReturnValue(new Promise(() => {}));
  render(<AdminOrdersPage />); await flush();
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
  expect(FakeEventSource.instances[0].close).toHaveBeenCalledOnce();
  await tick(); expect(getAdminOrders).toHaveBeenCalledOnce();
});

it('admin recovers transient read failures and retains write errors during reconciliation', async () => {
  render(<AdminOrdersPage />); await flush();
  vi.mocked(getAdminOrders).mockRejectedValueOnce(new Error('Could not load recent orders.'));
  await emit('connected');
  expect(screen.getByText('Could not load recent orders.')).toBeInTheDocument();
  await tick(); expect(screen.queryByText('Could not load recent orders.')).not.toBeInTheDocument();
  vi.mocked(updateAdminOrderStatus).mockRejectedValue(new Error('Could not update this order.'));
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'preparing' } }); await flush();
  expect(screen.getByText('Could not update this order.')).toBeInTheDocument();
  expect(screen.getByRole('combobox')).not.toBeDisabled();
});

it('serializes status writes and discards pre-write reads before reconciling with REST', async () => {
  render(<AdminOrdersPage />); await flush();
  let finishRead!: (value: ReturnType<typeof admin>[]) => void;
  let finishWrite!: (value: { id: string; order_number: number; status: 'preparing'; status_label: string }) => void;
  vi.mocked(getAdminOrders).mockImplementationOnce(() => new Promise((resolve) => { finishRead = resolve; }));
  await emit('connected');
  vi.mocked(updateAdminOrderStatus).mockImplementationOnce(() => new Promise((resolve) => { finishWrite = resolve; }));
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'preparing' } });
  expect(screen.getByRole('combobox')).toBeDisabled();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ready' } });
  expect(updateAdminOrderStatus).toHaveBeenCalledOnce();
  await emit('orders-changed');
  vi.mocked(getAdminOrders).mockResolvedValue([admin('preparing')]);
  await act(async () => { finishWrite({ id: '18', order_number: 18, status: 'preparing', status_label: 'Preparing' }); });
  await act(async () => { finishRead([admin()]); });
  expect(screen.getByRole('combobox')).toHaveValue('preparing');
  expect(getAdminOrders).toHaveBeenCalledTimes(3);
  expect(document.querySelector('time')).toHaveAttribute('datetime', '2026-05-30T18:00:00Z');
});

it('does not open an admin stream without a session', async () => {
  document.cookie = 'dom_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  render(<AdminOrdersPage />); await flush();
  expect(FakeEventSource.instances).toHaveLength(0);
  expect(getAdminOrders).not.toHaveBeenCalled();
});

it('closes an expired admin stream when REST reports unauthorized', async () => {
  render(<AdminOrdersPage />); await flush();
  vi.mocked(getAdminOrders).mockRejectedValue(new ApiError(401, 'Login required.'));
  await emit('connected');
  expect(screen.getByText('Login required.')).toBeInTheDocument();
  expect(FakeEventSource.instances[0].close).toHaveBeenCalledOnce();
  await tick(); expect(getAdminOrders).toHaveBeenCalledTimes(2);
});

it('does not resume or apply a pending write after admin unmount', async () => {
  let finish!: (value: { id: string; order_number: number; status: 'ready'; status_label: string }) => void;
  vi.mocked(updateAdminOrderStatus).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const view = render(<AdminOrdersPage />); await flush();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ready' } });
  view.unmount();
  await act(async () => { finish({ id: '18', order_number: 18, status: 'ready', status_label: 'Ready' }); });
  expect(FakeEventSource.instances[0].close).toHaveBeenCalledOnce();
  await tick(); expect(getAdminOrders).toHaveBeenCalledOnce();
});

it('ignores a previous guest order read when the public code changes', async () => {
  let finish!: (value: ReturnType<typeof guest>) => void;
  vi.mocked(getOrderStatus).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const view = render(<OrderStatusPage orderId="old" navigate={vi.fn()} />);
  view.rerender(<OrderStatusPage orderId="new" navigate={vi.fn()} />); await flush();
  expect(FakeEventSource.instances[0].close).toHaveBeenCalledOnce();
  await act(async () => { finish({ ...guest('ready'), guest_name: 'Old guest' }); });
  expect(screen.queryByText('Old guest')).not.toBeInTheDocument();
  expect(localStorage.getItem('dom_active_order_id')).toBe('new');
});
