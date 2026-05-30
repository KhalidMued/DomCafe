import type { PublicDrink } from '../lib/api';

export type CartItem = {
  drink: PublicDrink;
  quantity: number;
  temperature?: string;
  milk_option?: string;
  item_note?: string;
};

const listeners = new Set<() => void>();
let items: CartItem[] = [];

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
    existing.quantity += 1;
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

export function clearCart() {
  items = [];
  emit();
}

export function subscribeCart(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((listener) => listener());
}
