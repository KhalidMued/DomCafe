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

export type AdminLoginPayload = {
  username: string;
  password: string;
};

export type AdminTokenResponse = {
  access_token: string;
  token_type: 'bearer';
};

export type AdminDashboardSummary = {
  new_orders_count: number;
  preparing_orders_count: number;
  ready_orders_count: number;
  orders_open: boolean;
  available_drinks_count: number;
  available_beans_count: number;
};

export type AdminOrderStatus = 'new' | 'received' | 'preparing' | 'ready' | 'cancelled';

export type AdminOrderListItem = {
  id: string;
  order_number: number;
  guest_name: string;
  status: AdminOrderStatus;
  status_label: string;
  items_count: number;
  created_at: string;
};

export type AdminOrderStatusResponse = {
  id: string;
  order_number: number;
  status: AdminOrderStatus;
  status_label: string;
};

export type AdminMenuManagement = {
  orders_open: boolean;
  drinks: Array<{
    id: string;
    name: string;
    category_name: string;
    bean_name: string | null;
    photo_url: string;
    is_available: boolean;
  }>;
  beans: Array<{
    id: string;
    name: string;
    origin: string | null;
    is_available: boolean;
  }>;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.detail || 'We couldn’t reach DŌM right now.');
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

export function adminLogin(payload: AdminLoginPayload) {
  return request<AdminTokenResponse>('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getAdminDashboard(token: string) {
  return request<AdminDashboardSummary>('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAdminOrders(token: string) {
  return request<AdminOrderListItem[]>('/api/admin/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateAdminOrderStatus(token: string, orderId: string, status: AdminOrderStatus) {
  return request<AdminOrderStatusResponse>(`/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

export function getAdminMenu(token: string) {
  return request<AdminMenuManagement>('/api/admin/menu', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateAdminDrinkAvailability(token: string, drinkId: string, isAvailable: boolean) {
  return request<{ id: string; is_available: boolean }>(`/api/admin/menu/drinks/${drinkId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_available: isAvailable }),
  });
}

export function updateAdminBeanAvailability(token: string, beanId: string, isAvailable: boolean) {
  return request<{ id: string; is_available: boolean }>(`/api/admin/menu/beans/${beanId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_available: isAvailable }),
  });
}

export function updateAdminOrdersOpen(token: string, ordersOpen: boolean) {
  return request<{ orders_open: boolean }>('/api/admin/menu/settings/orders-open', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orders_open: ordersOpen }),
  });
}

export function uploadAdminDrinkPhoto(token: string, drinkId: string, photo: File) {
  const body = new FormData();
  body.append('drink_id', drinkId);
  body.append('photo', photo);
  return request<{ id: string; photo_url: string }>('/api/admin/uploads/drink-photo', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}
