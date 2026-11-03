import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authStore } from '@/store/authStore';
import type { ApiSuccessResponse, ApiErrorResponse, PaginationMeta } from './types';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Single refresh queue mechanism
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: Attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStore.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Response interceptor: 401 handling with single token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Skip refresh for auth login/refresh/logout requests themselves
    const isAuthRoute =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = authStore.getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        authStore.clearAuth();
        return Promise.reject(error);
      }

      try {
        // Direct call to refresh endpoint using standalone axios instance
        const response = await axios.post<
          ApiSuccessResponse<{ accessToken: string; refreshToken: string }>
        >(`${BASE_URL}/auth/refresh`, { refreshToken });

        if (response.data?.success && response.data.data) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response.data.data;
          authStore.setTokens(newAccessToken, newRefreshToken);

          processQueue(null, newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error('Invalid refresh response structure');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        authStore.clearAuth();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Unwrap helper that extracts data and meta from standardized backend response:
 * { success: true, data: T, meta?: PaginationMeta }
 */
export interface UnwrappedResult<T> {
  data: T;
  meta?: PaginationMeta;
}

export async function requestUnwrap<T>(
  requestFn: () => Promise<{ data: ApiSuccessResponse<T> }>
): Promise<UnwrappedResult<T>> {
  const response = await requestFn();
  return {
    data: response.data.data,
    meta: response.data.meta,
  };
}

/**
 * Type-safe API methods wrapping apiClient and unwrapping response data
 */
export const api = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<UnwrappedResult<T>> => {
    return requestUnwrap<T>(() => apiClient.get<ApiSuccessResponse<T>>(url, { params }));
  },

  post: async <T, B = unknown>(url: string, body?: B): Promise<UnwrappedResult<T>> => {
    return requestUnwrap<T>(() => apiClient.post<ApiSuccessResponse<T>>(url, body));
  },

  patch: async <T, B = unknown>(url: string, body?: B): Promise<UnwrappedResult<T>> => {
    return requestUnwrap<T>(() => apiClient.patch<ApiSuccessResponse<T>>(url, body));
  },

  put: async <T, B = unknown>(url: string, body?: B): Promise<UnwrappedResult<T>> => {
    return requestUnwrap<T>(() => apiClient.put<ApiSuccessResponse<T>>(url, body));
  },

  delete: async <T>(url: string, params?: Record<string, unknown>): Promise<UnwrappedResult<T>> => {
    return requestUnwrap<T>(() => apiClient.delete<ApiSuccessResponse<T>>(url, { params }));
  },
};

/**
 * Helper to extract human-readable error messages from Contract errors
 */
export function extractErrorMessage(error: unknown, fallback = 'Kutilmagan xatolik yuz berdi'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.error?.message) {
      if (data.error.details && data.error.details.length > 0) {
        const detailsText = data.error.details
          .map((d) => (d.field ? `${d.field}: ${d.message}` : d.message))
          .join(', ');
        return `${data.error.message} (${detailsText})`;
      }
      return data.error.message;
    }
    if (error.response?.status === 403) {
      return 'Sizda bu amalni bajarish uchun yetarli ruxsat yo\'q.';
    }
    if (error.response?.status === 401) {
      return 'Avtorizatsiya muddati tugagan yoki ruxsat berilmagan.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

