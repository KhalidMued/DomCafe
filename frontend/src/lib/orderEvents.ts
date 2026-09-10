// SSE messages are invalidations, never order data. One REST read at a time;
// an invalidation during a read queues another and makes the old result stale.
// Returning true from either handler ends the subscription (terminal/404/auth).
export function subscribeOrderEvents<T>(
  url: string,
  event: 'orders-changed' | 'order-changed',
  load: () => Promise<T>,
  onData: (data: T) => boolean | void,
  onError: (error: unknown) => boolean | void,
) {
  const fallbackDelay = 15_000;
  const reconciliationDelay = 60_000;
  let source: EventSource | undefined;
  let timer: number | undefined;
  let stopped = false;
  let connected = false;
  let failed = false;
  let running = false;
  let paused = false;
  let pending = false;
  let revision = 0;

  function clearTimer() {
    window.clearTimeout(timer);
    timer = undefined;
  }

  function schedule() {
    if (stopped || paused || timer !== undefined) return;
    // Pub/Sub is intentionally best-effort. Even a healthy-looking stream gets
    // a bounded reconciliation read so a dropped publish cannot stale it forever.
    const delay = connected && !failed ? reconciliationDelay : fallbackDelay;
    timer = window.setTimeout(() => { timer = undefined; refresh(); }, delay);
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimer();
    source?.removeEventListener('connected', onConnected);
    source?.removeEventListener(event, refresh);
    source?.removeEventListener('error', onDisconnected);
    source?.close();
  }

  async function run() {
    if (stopped || paused || running) return;
    running = true;
    pending = false;
    clearTimer();
    const current = revision;
    try {
      const data = await load();
      if (!stopped && current === revision) {
        failed = false;
        if (onData(data)) stop();
      }
    } catch (error) {
      if (!stopped && current === revision) {
        failed = true;
        if (onError(error)) stop();
      }
    } finally {
      running = false;
      if (pending && !stopped && !paused) void run();
      else schedule();
    }
  }

  function refresh() {
    if (stopped) return;
    revision += 1;
    pending = true;
    void run();
  }
  function onConnected() {
    connected = true;
    refresh(); // server has subscribed: closes the initial GET/subscription gap
  }
  function onDisconnected() {
    connected = false;
    clearTimer();
    schedule(); // keep EventSource alive so its native reconnect can recover
  }

  try {
    if (typeof EventSource !== 'undefined') {
      // Same-origin EventSource automatically carries the httpOnly admin cookie.
      source = new EventSource(url);
      source.addEventListener('connected', onConnected);
      source.addEventListener(event, refresh);
      source.addEventListener('error', onDisconnected);
    }
  } catch {
    // Unsupported/blocked streams must not prevent the initial REST read.
  }
  refresh();

  return {
    stop,
    pause() { paused = true; revision += 1; clearTimer(); },
    resume() { paused = false; refresh(); },
  };
}
