import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { subscribeOrderEvents } from '../lib/orderEvents';

class FakeEventSource extends EventTarget {
  static instances: FakeEventSource[] = [];
  close = vi.fn();
  constructor(public url: string) { super(); FakeEventSource.instances.push(this); }
  emit(name: string) { this.dispatchEvent(new MessageEvent(name, { data: '{}' })); }
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
beforeEach(() => {
  vi.useFakeTimers();
  FakeEventSource.instances = [];
  vi.stubGlobal('EventSource', FakeEventSource);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('refetches after every subscribed connection and invalidation, falling back only while disconnected', async () => {
  const load = vi.fn().mockResolvedValue('new');
  const subscription = subscribeOrderEvents('/api/admin/orders/events', 'orders-changed', load, vi.fn(), vi.fn());
  await flush();
  const source = FakeEventSource.instances[0];
  expect(source.url).toBe('/api/admin/orders/events');
  source.emit('open'); // transport open is not the server subscription acknowledgement
  expect(load).toHaveBeenCalledTimes(1);
  source.emit('connected'); await flush();
  source.emit('orders-changed'); await flush();
  expect(load).toHaveBeenCalledTimes(3);
  await vi.advanceTimersByTimeAsync(30_000);
  expect(load).toHaveBeenCalledTimes(3);
  await vi.advanceTimersByTimeAsync(30_000);
  expect(load).toHaveBeenCalledTimes(4); // bounded reconciliation while connected
  source.emit('error');
  await vi.advanceTimersByTimeAsync(15_000);
  expect(load).toHaveBeenCalledTimes(5);
  source.emit('connected'); await flush();
  expect(load).toHaveBeenCalledTimes(6);
  subscription.stop();
  source.emit('orders-changed');
  await vi.advanceTimersByTimeAsync(30_000);
  expect(load).toHaveBeenCalledTimes(6);
  expect(source.close).toHaveBeenCalledOnce();
});

it.each(['unsupported', 'constructor failure'])('polls with %s EventSource', async (mode) => {
  vi.stubGlobal('EventSource', mode === 'unsupported' ? undefined : class { constructor() { throw new Error('blocked'); } });
  const load = vi.fn().mockResolvedValue('new');
  const subscription = subscribeOrderEvents('/events', 'order-changed', load, vi.fn(), vi.fn());
  await flush();
  await vi.advanceTimersByTimeAsync(15_000);
  expect(load).toHaveBeenCalledTimes(2);
  subscription.stop();
  expect(vi.getTimerCount()).toBe(0);
});

it('resumes fallback after a REST failure even on a healthy stream, then stops polling after recovery', async () => {
  const load = vi.fn().mockResolvedValue('new');
  const error = vi.fn();
  const subscription = subscribeOrderEvents('/events', 'order-changed', load, vi.fn(), error);
  await flush();
  load.mockRejectedValueOnce(new Error('temporary'));
  FakeEventSource.instances[0].emit('connected'); await flush();
  expect(error).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(15_000);
  expect(load).toHaveBeenCalledTimes(3);
  await vi.advanceTimersByTimeAsync(30_000);
  expect(load).toHaveBeenCalledTimes(3);
  subscription.stop();
});

it.each(['data', 'error'])('closes permanently when the %s handler returns true', async (kind) => {
  const load = kind === 'data' ? vi.fn().mockResolvedValue('ready') : vi.fn().mockRejectedValue(new Error('404'));
  subscribeOrderEvents('/events', 'order-changed', load, () => kind === 'data', () => kind === 'error');
  await flush();
  expect(FakeEventSource.instances[0].close).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(30_000);
  expect(load).toHaveBeenCalledOnce();
});

it('coalesces invalidations and discards a stale in-flight read, including across a status write', async () => {
  let resolve!: (value: string) => void;
  const load = vi.fn().mockImplementationOnce(() => new Promise<string>((done) => { resolve = done; })).mockResolvedValue('fresh');
  const data = vi.fn();
  const subscription = subscribeOrderEvents('/events', 'order-changed', load, data, vi.fn());
  const source = FakeEventSource.instances[0];
  source.emit('connected'); source.emit('order-changed');
  subscription.pause();
  resolve('stale'); await flush();
  expect(data).not.toHaveBeenCalled();
  expect(load).toHaveBeenCalledOnce();
  subscription.resume(); await flush();
  expect(load).toHaveBeenCalledTimes(2);
  expect(data).toHaveBeenCalledExactlyOnceWith('fresh');
  subscription.stop();
});

it('ignores pending REST completion after cleanup', async () => {
  let resolve!: (value: string) => void;
  const data = vi.fn();
  const subscription = subscribeOrderEvents('/events', 'order-changed', () => new Promise<string>((done) => { resolve = done; }), data, vi.fn());
  subscription.stop(); resolve('late'); await flush();
  expect(data).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
