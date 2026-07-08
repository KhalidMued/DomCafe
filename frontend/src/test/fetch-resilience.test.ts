import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, createOrder, getMenu } from '../lib/api';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const orderPayload = {
  guest_name: 'Ahmed',
  items: [{ drink_id: 'espresso', quantity: 1, temperature: 'hot' }],
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('fetch resilience', () => {
  it('retries a GET on 503 with backoff and succeeds', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'busy' }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const pending = getMenu();
    await vi.advanceTimersByTimeAsync(600);

    await expect(pending).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting retries on network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    const pending = getMenu().catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(600 + 1800);

    const error = await pending;
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
    expect((error as ApiError).message).toMatch(/couldn’t reach DŌM/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('never retries a POST, even on a retryable status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'busy' }, { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createOrder(orderPayload)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never retries a POST on network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createOrder(orderPayload)).rejects.toMatchObject({ status: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry non-retryable statuses like 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'Order not found.' }, { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getMenu()).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails fast with a friendly message while offline', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getMenu()).rejects.toMatchObject({
      status: 0,
      message: 'You look offline. Please check your connection and try again.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aborts a hung request after the timeout and retries', async () => {
    let firstSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => {
      if (fetchMock.mock.calls.length === 1) {
        firstSignal = init?.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      }
      return Promise.resolve(jsonResponse([]));
    });
    vi.stubGlobal('fetch', fetchMock);

    const pending = getMenu();
    await vi.advanceTimersByTimeAsync(10_000); // hits the timeout
    await vi.advanceTimersByTimeAsync(600); // first backoff delay

    await expect(pending).resolves.toEqual([]);
    expect(firstSignal?.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
