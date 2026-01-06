// API Client for Carrier App

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

  register: async (data: { email: string; password: string; name: string }) => {
    const response = await request<{ accessToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: { ...data, role: 'carrier' },
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
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

  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
};

// Tenders API (for carrier)
export const tendersApi = {
  getMyTenders: async (params?: { page?: number; limit?: number; status?: string }) => {
    const user = authApi.getUser();
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.status) queryParams.set('status', params.status);
    if (user?.entityId) queryParams.set('carrierId', user.entityId);
    return request<{ data: any[]; pagination: any }>(`/tenders?${queryParams}`);
  },

  getById: async (id: string) => {
    return request<any>(`/tenders/${id}`);
  },

  accept: async (id: string, data: { driverId: string; pickupInstructions?: string; deliveryInstructions?: string }) => {
    return request<any>(`/tenders/${id}/accept`, { method: 'PUT', body: data });
  },

  decline: async (id: string) => {
    return request<any>(`/tenders/${id}/decline`, { method: 'PUT' });
  },
};

// Loads API
export const loadsApi = {
  getById: async (id: string) => {
    return request<any>(`/loads/${id}`);
  },

  updateStatus: async (id: string, status: string) => {
    return request<any>(`/loads/${id}`, { method: 'PUT', body: { status } });
  },
};

// Documents API
export const documentsApi = {
  upload: async (data: { loadId: string; type: string; filename: string; url: string }) => {
    return request<any>('/documents', { method: 'POST', body: data });
  },

  getForLoad: async (loadId: string) => {
    return request<any[]>(`/documents/load/${loadId}`);
  },
};

// Payments API
export const paymentsApi = {
  getMyPayouts: async (params?: { page?: number; limit?: number; status?: string }) => {
    const user = authApi.getUser();
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.status) queryParams.set('status', params.status);
    if (user?.entityId) queryParams.set('carrierId', user.entityId);
    return request<{ data: any[]; pagination: any }>(`/payments/payouts?${queryParams}`);
  },

  getSummary: async () => {
    const user = authApi.getUser();
    if (user?.entityId) {
      return request<any>(`/payments/carrier/${user.entityId}/summary`);
    }
    return null;
  },
};

// Drivers API
export const driversApi = {
  getMyDrivers: async () => {
    const user = authApi.getUser();
    if (user?.entityId) {
      return request<any[]>(`/carriers/${user.entityId}/drivers`);
    }
    return [];
  },

  addDriver: async (data: any) => {
    const user = authApi.getUser();
    if (user?.entityId) {
      return request<any>(`/carriers/${user.entityId}/drivers`, { method: 'POST', body: data });
    }
    throw new Error('No carrier ID found');
  },
};

export { ApiError };
