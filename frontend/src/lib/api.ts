export type PublicSettings = {
  cafe_name: string;
  welcome_message: string;
  orders_open: boolean;
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  description: string | null;
  drinks: PublicDrink[];
};

export type PublicDrink = {
  id: string;
  name: string;
  description: string | null;
  ingredients: string[];
  bean: { id: string; name: string; origin: string | null; tasting_notes: string[] } | null;
  photo_url: string;
  available: boolean;
  temperature_options: string[];
  milk_options: string[];
  estimated_time_minutes: number;
};

export type OrderStatus = {
  id: string;
  order_number: number;
  guest_name: string;
  status: string;
  status_label: string;
  items: Array<{
    drink_name: string;
    quantity: number;
    temperature: string | null;
    milk_option: string | null;
    item_note: string | null;
    bean_name: string | null;
    photo_url: string | null;
  }>;
  created_at: string;
};

export type CreateOrderPayload = {
  guest_name: string;
  guest_note?: string;
  items: Array<{
    drink_id: string;
    quantity: number;
    temperature?: string;
    milk_option?: string;
    item_note?: string;
  }>;
};

export type CreateOrderResponse = {
  order_id: string;
  order_number: number;
  status: string;
  message: string;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'We couldn’t reach DŌM right now.');
  }
  return data as T;
}

export function getPublicSettings() {
  return request<PublicSettings>('/api/settings/public');
}

export function getMenu() {
  return request<PublicMenuCategory[]>('/api/menu');
}

export function createOrder(payload: CreateOrderPayload) {
  return request<CreateOrderResponse>('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getOrderStatus(orderId: string) {
  return request<OrderStatus>(`/api/orders/${orderId}`);
}
