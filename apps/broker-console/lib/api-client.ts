// API Client for Clearhaul Brokerage Platform

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message || 'Request failed');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  register: async (data: { email: string; password: string; name: string; role?: string }) => {
    const response = await request<{ accessToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: data,
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  getProfile: async () => {
    return request<any>('/auth/profile');
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('auth_token');
    }
    return false;
  },

  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },

  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
};

// Loads API
export const loadsApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string; shipperId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.status) queryParams.set('status', params.status);
    if (params?.shipperId) queryParams.set('shipper_id', params.shipperId);
    return request<{ data: any[]; pagination: any }>(`/loads?${queryParams}`);
  },

  getById: async (id: string) => {
    return request<any>(`/loads/${id}`);
  },

  create: async (data: any) => {
    return request<any>('/loads', { method: 'POST', body: data });
  },

  update: async (id: string, data: any) => {
    return request<any>(`/loads/${id}`, { method: 'PUT', body: data });
  },

  delete: async (id: string) => {
    return request<void>(`/loads/${id}`, { method: 'DELETE' });
  },

  requestQuote: async (id: string) => {
    return request<any>(`/loads/${id}/quote`, { method: 'POST' });
  },

  createTender: async (id: string, data: { carrier_id: string; price_usd: number; expires_at: string }) => {
    return request<any>(`/loads/${id}/tender`, { method: 'POST', body: data });
  },
};

// Carriers API
export const carriersApi = {
  getAll: async (params?: { page?: number; limit?: number; equipment?: string; minScore?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.equipment) queryParams.set('equipment', params.equipment);
    if (params?.minScore) queryParams.set('minScore', String(params.minScore));
    return request<{ data: any[]; pagination: any }>(`/carriers?${queryParams}`);
  },

  getById: async (id: string) => {
    return request<any>(`/carriers/${id}`);
  },

  create: async (data: any) => {
    return request<any>('/carriers', { method: 'POST', body: data });
  },

  update: async (id: string, data: any) => {
    return request<any>(`/carriers/${id}`, { method: 'PUT', body: data });
  },

  delete: async (id: string) => {
    return request<void>(`/carriers/${id}`, { method: 'DELETE' });
  },

  getDrivers: async (carrierId: string) => {
    return request<any[]>(`/carriers/${carrierId}/drivers`);
  },

  addDriver: async (carrierId: string, data: any) => {
    return request<any>(`/carriers/${carrierId}/drivers`, { method: 'POST', body: data });
  },
};

// Shippers API
export const shippersApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.search) queryParams.set('search', params.search);
    return request<{ data: any[]; pagination: any }>(`/shippers?${queryParams}`);
  },

  getById: async (id: string) => {
    return request<any>(`/shippers/${id}`);
  },

  create: async (data: any) => {
    return request<any>('/shippers', { method: 'POST', body: data });
  },

  update: async (id: string, data: any) => {
    return request<any>(`/shippers/${id}`, { method: 'PUT', body: data });
  },

  delete: async (id: string) => {
    return request<void>(`/shippers/${id}`, { method: 'DELETE' });
  },

  getLoads: async (id: string) => {
    return request<any[]>(`/shippers/${id}/loads`);
  },
};

// Quotes API
export const quotesApi = {
  getAll: async (params?: { page?: number; limit?: number; loadId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.loadId) queryParams.set('loadId', params.loadId);
    return request<{ data: any[]; pagination: any }>(`/quotes?${queryParams}`);
  },

  getById: async (id: string) => {
    return request<any>(`/quotes/${id}`);
  },

  create: async (data: any) => {
    return request<any>('/quotes', { method: 'POST', body: data });
  },

  calculate: async (data: { distance: number; equipmentCode: string; serviceLevel: string; weight?: number; fuelIndex?: number }) => {
    return request<any>('/quotes/calculate', { method: 'POST', body: data });
  },
};

// Tenders API
export const tendersApi = {
  getAll: async (params?: { page?: number; limit?: number; loadId?: string; carrierId?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.loadId) queryParams.set('loadId', params.loadId);
    if (params?.carrierId) queryParams.set('carrierId', params.carrierId);
    if (params?.status) queryParams.set('status', params.status);
    return request<{ data: any[]; pagination: any }>(`/tenders?${queryParams}`);
  },

  getById: async (id: string) => {
    return request<any>(`/tenders/${id}`);
  },

  create: async (data: any) => {
    return request<any>('/tenders', { method: 'POST', body: data });
  },

  accept: async (id: string, data: { driverId: string; pickupInstructions?: string; deliveryInstructions?: string }) => {
    return request<any>(`/tenders/${id}/accept`, { method: 'PUT', body: data });
  },

  decline: async (id: string) => {
    return request<any>(`/tenders/${id}/decline`, { method: 'PUT' });
  },

  getByLoad: async (loadId: string) => {
    return request<any[]>(`/tenders/load/${loadId}`);
  },

  getByCarrier: async (carrierId: string) => {
    return request<any[]>(`/tenders/carrier/${carrierId}`);
  },
};

// Documents API
export const documentsApi = {
  getAll: async (params?: { page?: number; limit?: number; loadId?: string; type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.loadId) queryParams.set('loadId', params.loadId);
    if (params?.type) queryParams.set('type', params.type);
    return request<{ data: any[]; pagination: any }>(`/documents?${queryParams}`);
  },

  getById: async (id: string) => {
    return request<any>(`/documents/${id}`);
  },

  getByLoad: async (loadId: string) => {
    return request<any[]>(`/documents/load/${loadId}`);
  },

  create: async (data: { loadId: string; type: string; filename: string; url: string }) => {
    return request<any>('/documents', { method: 'POST', body: data });
  },

  verify: async (id: string) => {
    return request<any>(`/documents/${id}/verify`, { method: 'PUT' });
  },

  delete: async (id: string) => {
    return request<void>(`/documents/${id}`, { method: 'DELETE' });
  },
};

// Payments API
export const paymentsApi = {
  // Invoices
  getInvoices: async (params?: { page?: number; limit?: number; carrierId?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.carrierId) queryParams.set('carrierId', params.carrierId);
    if (params?.status) queryParams.set('status', params.status);
    return request<{ data: any[]; pagination: any }>(`/payments/invoices?${queryParams}`);
  },

  getInvoice: async (id: string) => {
    return request<any>(`/payments/invoices/${id}`);
  },

  createInvoice: async (data: { loadId: string; carrierId: string; amountUsd: number; dueDate: string }) => {
    return request<any>('/payments/invoices', { method: 'POST', body: data });
  },

  markInvoicePaid: async (id: string) => {
    return request<any>(`/payments/invoices/${id}/pay`, { method: 'PUT' });
  },

  // Payouts
  getPayouts: async (params?: { page?: number; limit?: number; carrierId?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.carrierId) queryParams.set('carrierId', params.carrierId);
    if (params?.status) queryParams.set('status', params.status);
    return request<{ data: any[]; pagination: any }>(`/payments/payouts?${queryParams}`);
  },

  getPayout: async (id: string) => {
    return request<any>(`/payments/payouts/${id}`);
  },

  createPayout: async (data: { carrierId: string; invoiceId?: string; amountUsd: number; method: string }) => {
    return request<any>('/payments/payouts', { method: 'POST', body: data });
  },

  processPayout: async (id: string) => {
    return request<any>(`/payments/payouts/${id}/process`, { method: 'PUT' });
  },

  completePayout: async (id: string) => {
    return request<any>(`/payments/payouts/${id}/complete`, { method: 'PUT' });
  },

  // Summary
  getSummary: async () => {
    return request<any>('/payments/summary');
  },

  getCarrierSummary: async (carrierId: string) => {
    return request<any>(`/payments/carrier/${carrierId}/summary`);
  },
};

// Health API
export const healthApi = {
  check: async () => {
    return request<any>('/health');
  },

  ready: async () => {
    return request<{ status: string }>('/health/ready');
  },

  live: async () => {
    return request<{ status: string }>('/health/live');
  },
};

export { ApiError };
