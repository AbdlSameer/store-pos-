import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

// A shared shop computer/tablet that stays logged in indefinitely is
// a walk-up risk - anyone nearby can use the owner or cashier
// session. Auto-logout after a period of no interaction closes that
// gap without requiring device-level restrictions.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

export function useIdleLogout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    function handleIdle() {
      api.post('/auth/logout').catch(() => {});
      logout();
      navigate('/login?reason=idle', { replace: true });
    }

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleIdle, IDLE_TIMEOUT_MS);
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [user, logout, navigate]);
}
