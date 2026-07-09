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

export type AdminSessionResponse = {
  ok: boolean;
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
  categories: Array<{
    id: string;
    label: string;
    description: string | null;
    accent_color: string | null;
    display_order: number;
    is_available: boolean;
  }>;
  drinks: Array<{
    id: string;
    name: string;
    category_id: string;
    category_name: string;
    bean_id: string | null;
    bean_name: string | null;
    description: string | null;
    ingredients: string[];
    photo_url: string;
    is_available: boolean;
    temperature_options: string[];
    milk_options: string[];
    estimated_time_minutes: number;
  }>;
  beans: Array<{
    id: string;
    name: string;
    origin: string | null;
    process: string | null;
    tasting_notes: string[];
    is_available: boolean;
  }>;
};

export type AdminSettings = {
  cafe_name: string;
  welcome_message: string;
  orders_open: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [600, 1800];
// Transient edge/backend failures worth a quiet retry; 429 stays fatal so we
// never fight the rate limiter.
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

function offlineError() {
  return new ApiError(0, 'You look offline. Please check your connection and try again.');
}

function networkError() {
  return new ApiError(0, 'We couldn’t reach DŌM right now. Please check your connection and try again.');
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  // Only idempotent reads retry: replaying a POST could duplicate an order.
  const retryDelays = !init?.method || init.method === 'GET' ? RETRY_DELAYS_MS : [];
  let lastError = networkError();

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, retryDelays[attempt - 1]));
    }
    if (navigator.onLine === false) {
      throw offlineError();
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(url, init);
    } catch {
      lastError = navigator.onLine ? networkError() : offlineError();
      continue;
    }

    // Rate-limit and gateway errors can come from Nginx as HTML, so the body
    // may not be JSON.
    let data: { message?: string; detail?: string } | null = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      const fallback = response.status === 429
        ? 'Please slow down a moment, then try again.'
        : 'We couldn’t reach DŌM right now.';
      const error = new ApiError(response.status, data?.message || data?.detail || fallback);
      if (RETRYABLE_STATUSES.has(response.status) && attempt < retryDelays.length) {
        lastError = error;
        continue;
      }
      throw error;
    }
    return data as T;
  }

  throw lastError;
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

// The admin JWT lives in an httpOnly cookie the browser attaches to
// same-origin requests automatically; this hint cookie is the only part
// page scripts can see, and it carries no secret.
export function hasAdminSession() {
  return document.cookie.split('; ').some((part) => part.startsWith('dom_admin_session='));
}

export function adminLogin(payload: AdminLoginPayload) {
  return request<AdminSessionResponse>('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function adminLogout() {
  return request<AdminSessionResponse>('/api/admin/logout', { method: 'POST' });
}

export function getAdminDashboard() {
  return request<AdminDashboardSummary>('/api/admin/dashboard');
}

export function getAdminOrders() {
  return request<AdminOrderListItem[]>('/api/admin/orders');
}

export function updateAdminOrderStatus(orderId: string, status: AdminOrderStatus) {
  return request<AdminOrderStatusResponse>(`/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function getAdminMenu() {
  return request<AdminMenuManagement>('/api/admin/menu');
}

export function updateAdminDrinkAvailability(drinkId: string, isAvailable: boolean) {
  return request<{ id: string; is_available: boolean }>(`/api/admin/menu/drinks/${drinkId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_available: isAvailable }),
  });
}

export function updateAdminBeanAvailability(beanId: string, isAvailable: boolean) {
  return request<{ id: string; is_available: boolean }>(`/api/admin/menu/beans/${beanId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_available: isAvailable }),
  });
}

export function updateAdminCategoryAvailability(categoryId: string, isAvailable: boolean) {
  return request<{ id: string; is_available: boolean }>(`/api/admin/menu/categories/${categoryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_available: isAvailable }),
  });
}

export function createAdminCategory(
  payload: { id: string; label: string; description: string; accent_color: string; display_order: number },
) {
  return request<AdminMenuManagement['categories'][number]>('/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function archiveAdminCategory(categoryId: string) {
  return request<AdminMenuManagement['categories'][number]>(`/api/admin/categories/${categoryId}`, {
    method: 'DELETE',
  });
}

export function updateAdminOrdersOpen(ordersOpen: boolean) {
  return request<{ orders_open: boolean }>('/api/admin/menu/settings/orders-open', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders_open: ordersOpen }),
  });
}

export function uploadAdminDrinkPhoto(drinkId: string, photo: File) {
  const body = new FormData();
  body.append('drink_id', drinkId);
  body.append('photo', photo);
  return request<{ id: string; photo_url: string }>('/api/admin/uploads/drink-photo', {
    method: 'POST',
    body,
  });
}

export function updateAdminDrinkDetails(
  drinkId: string,
  payload: {
    name: string;
    category_id: string;
    default_bean_id: string;
    description: string;
    ingredients: string[];
    temperature_options: string[];
    milk_options: string[];
    estimated_time_minutes: number;
  },
) {
  return request<AdminMenuManagement['drinks'][number]>(`/api/admin/drinks/${drinkId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function createAdminDrink(
  payload: {
    id: string;
    name: string;
    category_id: string;
    default_bean_id: string;
    description: string;
    ingredients: string[];
    photo_url: string;
    temperature_options: string[];
    milk_options: string[];
    estimated_time_minutes: number;
  },
) {
  return request<AdminMenuManagement['drinks'][number]>('/api/admin/drinks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function archiveAdminDrink(drinkId: string) {
  return request<AdminMenuManagement['drinks'][number]>(`/api/admin/drinks/${drinkId}`, {
    method: 'DELETE',
  });
}

export function updateAdminBeanDetails(
  beanId: string,
  payload: {
    name: string;
    origin: string;
    process: string;
    tasting_notes: string[];
  },
) {
  return request<AdminMenuManagement['beans'][number]>(`/api/admin/beans/${beanId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function createAdminBean(
  payload: { id: string; name: string; origin: string; process: string; tasting_notes: string[] },
) {
  return request<AdminMenuManagement['beans'][number]>('/api/admin/beans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function archiveAdminBean(beanId: string) {
  return request<AdminMenuManagement['beans'][number]>(`/api/admin/beans/${beanId}`, {
    method: 'DELETE',
  });
}

export function updateAdminCategoryDetails(
  categoryId: string,
  payload: {
    label: string;
    description: string;
    accent_color: string;
    display_order: number;
  },
) {
  return request<AdminMenuManagement['categories'][number]>(`/api/admin/categories/${categoryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getAdminSettings() {
  return request<AdminSettings>('/api/admin/settings');
}

export function updateAdminSettings(payload: AdminSettings) {
  return request<AdminSettings>('/api/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
