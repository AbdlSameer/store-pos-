import { useEffect } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const baseURL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

/**
 * Runs once on app mount. Since the access token is now kept only in
 * memory (see authStore.ts), a page refresh clears it. This hook
 * silently exchanges the httpOnly refresh cookie for a new access
 * token and re-fetches the current user, so the session survives
 * reloads without ever storing the token in localStorage.
 */
export function useAuthBootstrap() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const accessToken = data.data.accessToken as string;

        // We now have a fresh access token but not the user profile
        // (it isn't persisted anywhere client-side) - fetch it.
        const meRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!cancelled) {
          setAuth(meRes.data.data, accessToken);
        }
      } catch {
        // No valid refresh cookie (never logged in, or it expired) -
        // that's fine, the user just sees the login page.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setAuth, setHydrated]);
}
