import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  hydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setToken: (token: string) => void;
  setHydrated: (value: boolean) => void;
  logout: () => void;
}

// IMPORTANT: no `persist` middleware here on purpose.
//
// The access token used to be persisted to localStorage, which is
// readable by any script running on the page (including injected
// XSS payloads). That defeats the whole point of the httpOnly
// refresh-token cookie set by the server.
//
// Instead: the access token lives only in memory for the life of
// the tab. On app boot, `bootstrapAuth()` (see AuthProvider) calls
// POST /auth/refresh, which reads the httpOnly cookie server-side
// and returns a fresh access token - so the user stays logged in
// across page reloads without the token ever touching localStorage.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  hydrated: false,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setToken: (accessToken) => set({ accessToken }),
  setHydrated: (value) => set({ hydrated: value }),
  logout: () => set({ user: null, accessToken: null }),
}));
