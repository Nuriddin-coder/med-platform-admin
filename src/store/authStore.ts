import { useSyncExternalStore } from 'react';
import type { User, AuthResponseData } from '@/api/types';
import type { RoleType } from '@/constants/enums';
import { ALLOWED_ADMIN_ROLES } from '@/constants/enums';

const ACCESS_TOKEN_KEY = 'med_access_token';
const REFRESH_TOKEN_KEY = 'med_refresh_token';
const USER_KEY = 'med_auth_user';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

let state: AuthState = {
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  user: (() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem(ACCESS_TOKEN_KEY),
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getState(): AuthState {
    return state;
  },

  getAccessToken(): string | null {
    return state.accessToken;
  },

  getRefreshToken(): string | null {
    return state.refreshToken;
  },

  getUser(): User | null {
    return state.user;
  },

  setAuth(data: AuthResponseData): void {
    state = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
      isAuthenticated: true,
    };
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } catch (e) {
      console.error('Failed to save auth to localStorage', e);
    }
    notify();
  },

  setTokens(accessToken: string, refreshToken: string): void {
    state = {
      ...state,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    };
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {
      console.error('Failed to update tokens in localStorage', e);
    }
    notify();
  },

  setUser(user: User): void {
    state = {
      ...state,
      user,
    };
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to update user in localStorage', e);
    }
    notify();
  },

  clearAuth(): void {
    state = {
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    };
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to clear auth from localStorage', e);
    }
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  hasRole(allowedRoles: RoleType[]): boolean {
    if (!state.user) return false;
    return allowedRoles.includes(state.user.role as RoleType);
  },

  isAdminUser(): boolean {
    if (!state.user) return false;
    return ALLOWED_ADMIN_ROLES.includes(state.user.role as RoleType);
  },
};

export function useAuth() {
  const current = useSyncExternalStore(
    authStore.subscribe,
    authStore.getState,
    authStore.getState
  );

  return {
    ...current,
    login: authStore.setAuth,
    logout: authStore.clearAuth,
    setUser: authStore.setUser,
    hasRole: authStore.hasRole,
    isAdminUser: authStore.isAdminUser,
  };
}

