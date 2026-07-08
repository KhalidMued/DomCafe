import type { PublicDrink } from '../lib/api';

export type CartItem = {
  drink: PublicDrink;
  quantity: number;
  temperature?: string;
  milk_option?: string;
  item_note?: string;
};

// The backend rejects quantities above 10 per item.
export const MAX_ITEM_QUANTITY = 10;

const listeners = new Set<() => void>();
const CART_ITEMS_KEY = 'dom_cart_items';

function loadStoredItems(): CartItem[] {
  try {
    const raw = window.sessionStorage.getItem(CART_ITEMS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

let items: CartItem[] = loadStoredItems();

export const GUEST_NAME_KEY = 'dom_guest_name';

export function getGuestName() {
  return window.localStorage.getItem(GUEST_NAME_KEY) || '';
}

export function setGuestName(name: string) {
  window.localStorage.setItem(GUEST_NAME_KEY, name.trim());
  emit();
}

export function getCartItems() {
  return items;
}

export function addCartItem(drink: PublicDrink) {
  const existing = items.find((item) => item.drink.id === drink.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, MAX_ITEM_QUANTITY);
  } else {
    items = [
      ...items,
      {
        drink,
        quantity: 1,
        temperature: drink.temperature_options[0],
        milk_option: drink.milk_options[0],
      },
    ];
  }
  emit();
}

export function updateCartItem(drinkId: string, patch: Partial<CartItem>) {
  items = items.map((item) => (item.drink.id === drinkId ? { ...item, ...patch } : item));
  emit();
}

export function removeCartItem(drinkId: string) {
  items = items.filter((item) => item.drink.id !== drinkId);
  emit();
}

export function clearCart() {
  items = [];
  emit();
}

export function subscribeCart(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  try {
    window.sessionStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
  } catch {
    // Storage may be unavailable (private mode quotas); the in-memory cart still works.
  }
  listeners.forEach((listener) => listener());
}
