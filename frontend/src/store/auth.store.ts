// src/store/auth.store.ts
import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('access_token', data.accessToken);
      set({ user: data.user, loading: false });
    } catch (err: any) {
      set({ loading: false });
      throw new Error(err.response?.data?.message || 'Erro ao fazer login.');
    }
  },

  logout: async () => {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('access_token');
    set({ user: null });
    window.location.href = '/login';
  },

  loadMe: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data });
    } catch {
      localStorage.removeItem('access_token');
    }
  },
}));
