import { useEffect, useState, useCallback, useRef } from 'react';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  expiresAt: string;
  daysRemaining: number;
  role: 'student' | 'admin';
}

const STORAGE_KEY_USER = 'laclave_cached_session_user_v1';
const STORAGE_KEY_LAST_CHECK = 'laclave_last_session_check_v1';
const STORAGE_KEY_SERVER_TIME = 'laclave_last_server_time_v1';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function useSessionGuard() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(STORAGE_KEY_USER);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const sessionUserRef = useRef<SessionUser | null>(sessionUser);
  sessionUserRef.current = sessionUser;

  const [isValidating, setIsValidating] = useState<boolean>(true);
  const isKickingRef = useRef<boolean>(false);

  const checkSession = useCallback(async (force = false) => {
    if (isKickingRef.current) return;

    const currentUser = sessionUserRef.current;
    const now = Date.now();
    const lastCheck = Number(localStorage.getItem(STORAGE_KEY_LAST_CHECK) || 0);
    const lastServerTime = Number(localStorage.getItem(STORAGE_KEY_SERVER_TIME) || 0);

    // Anti-tamper check: clock set backward by more than 2 minutes
    const isClockTampered = lastServerTime > 0 && now < (lastServerTime - 120000);

    // If we have in-memory session, check for immediate expiration
    if (currentUser?.expiresAt) {
      const expiry = new Date(currentUser.expiresAt).getTime();
      if (now >= expiry) {
        isKickingRef.current = true;
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_LAST_CHECK);
        window.location.href = '/login?reason=expired';
        return;
      }
      const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
      if (daysRemaining !== currentUser.daysRemaining) {
        setSessionUser((prev) => (prev ? { ...prev, daysRemaining } : null));
      }
    }

    // Only hit the server if forced, clock was tampered, or > 1h since last check
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const shouldCheckServer = force || isClockTampered || (now - lastCheck > ONE_HOUR_MS);

    if (!shouldCheckServer && currentUser) {
      setIsValidating(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!res.ok) {
        isKickingRef.current = true;
        const data = await res.json().catch(() => ({}));
        const reason = data.reason === 'blocked' ? 'blocked' : (data.reason === 'expired' ? 'expired' : 'ended');
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_LAST_CHECK);
        window.location.href = `/login?reason=${reason}`;
        return;
      }

      const data = await res.json();
      if (!data.authenticated || !data.user) {
        isKickingRef.current = true;
        const reason = data.reason === 'blocked' ? 'blocked' : (data.reason === 'expired' ? 'expired' : 'ended');
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_LAST_CHECK);
        window.location.href = `/login?reason=${reason}`;
        return;
      }

      const serverNow = data.serverTime ? new Date(data.serverTime).getTime() : now;
      const expiryTime = new Date(data.user.expiresAt).getTime();

      if (serverNow >= expiryTime || data.user.daysRemaining <= 0) {
        isKickingRef.current = true;
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_LAST_CHECK);
        window.location.href = '/login?reason=expired';
        return;
      }

      localStorage.setItem(STORAGE_KEY_SERVER_TIME, String(serverNow));
      localStorage.setItem(STORAGE_KEY_LAST_CHECK, String(now));
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));

      setSessionUser(data.user);
    } catch (e) {
      // Offline fallback: allow student to keep practicing if cached session exists and isn't expired
      const currentUser = sessionUserRef.current;
      if (typeof navigator !== 'undefined' && !navigator.onLine && currentUser) {
        const expiry = new Date(currentUser.expiresAt).getTime();
        if (Date.now() >= expiry) {
          isKickingRef.current = true;
          localStorage.removeItem(STORAGE_KEY_USER);
          window.location.href = '/login?reason=expired';
        }
        return;
      }
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    // Initial verification on mount
    checkSession(true);

    // Dynamic timer: evaluate local expiration and daily countdown every 30 seconds
    const ticker = setInterval(() => {
      if (isKickingRef.current) return;
      const cached = localStorage.getItem(STORAGE_KEY_USER);
      if (!cached) return;
      try {
        const parsed = JSON.parse(cached);
        if (parsed.expiresAt) {
          const now = Date.now();
          const expiry = new Date(parsed.expiresAt).getTime();
          if (now >= expiry) {
            isKickingRef.current = true;
            localStorage.removeItem(STORAGE_KEY_USER);
            localStorage.removeItem(STORAGE_KEY_LAST_CHECK);
            window.location.href = '/login?reason=expired';
            return;
          }
          const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
          setSessionUser((prev) => (prev ? { ...prev, daysRemaining } : null));
        }
      } catch {}
    }, 30000);

    // Verify with server every hour
    const serverInterval = setInterval(() => {
      checkSession(false);
    }, 60 * 60 * 1000);

    return () => {
      clearInterval(ticker);
      clearInterval(serverInterval);
    };
  }, [checkSession]);

  return {
    sessionUser,
    isValidating,
    checkSession,
  };
}
