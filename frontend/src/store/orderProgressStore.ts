const activeOrderKey = 'dom_active_order_id';

export function getActiveOrderId() {
  return window.localStorage.getItem(activeOrderKey);
}

export function setActiveOrderId(orderId: string) {
  window.localStorage.setItem(activeOrderKey, orderId);
}

export function clearActiveOrderId(orderId?: string) {
  if (!orderId || getActiveOrderId() === orderId) {
    window.localStorage.removeItem(activeOrderKey);
  }
}
