import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  // State
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  // Initial state
  isAuthenticated: false,
  user: null,
  accessToken: null,
  isLoading: true, // Start as loading to prevent premature redirects
  error: null,

  // Actions
  login: (user, accessToken) => {
    // Store access token in localStorage
    localStorage.setItem("access_token", accessToken);

    set({
      isAuthenticated: true,
      user,
      accessToken,
      error: null,
    });
  },

  logout: () => {
    // Clear access token from localStorage
    localStorage.removeItem("access_token");

    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      error: null,
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  updateUser: (userData) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: { ...currentUser, ...userData },
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
