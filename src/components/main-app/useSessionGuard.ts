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

  const [isValidating, setIsValidating] = useState<boolean>(true);
  const isKickingRef = useRef<boolean>(false);

  const checkSession = useCallback(async (force = false) => {
    if (isKickingRef.current) return;

    const now = Date.now();
    const lastCheck = Number(localStorage.getItem(STORAGE_KEY_LAST_CHECK) || 0);
    const lastServerTime = Number(localStorage.getItem(STORAGE_KEY_SERVER_TIME) || 0);

    // Anti-tamper check: clock set backward by more than 2 minutes
    const isClockTampered = lastServerTime > 0 && now < (lastServerTime - 120000);

    // Only hit the server if forced, clock was tampered, or > 24h since last verified check
    const shouldCheckServer = force || isClockTampered || (now - lastCheck > TWENTY_FOUR_HOURS_MS);

    // If we have valid cached session and don't need server check yet, calculate daysRemaining in memory
    if (!shouldCheckServer && sessionUser) {
      const expiry = new Date(sessionUser.expiresAt).getTime();
      if (now > expiry) {
        // Expired in memory: force immediate server verification
      } else {
        const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
        setSessionUser((prev) => prev ? { ...prev, daysRemaining } : null);
        setIsValidating(false);
        return;
      }
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

      // Record authoritative server time to prevent clock tampering
      const serverNow = data.serverTime ? new Date(data.serverTime).getTime() : now;
      localStorage.setItem(STORAGE_KEY_SERVER_TIME, String(serverNow));
      localStorage.setItem(STORAGE_KEY_LAST_CHECK, String(now));
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));

      setSessionUser(data.user);
    } catch (e) {
      // Offline fallback: allow student to keep practicing if cached session exists and isn't expired
      if (typeof navigator !== 'undefined' && !navigator.onLine && sessionUser) {
        return;
      }
    } finally {
      setIsValidating(false);
    }
  }, [sessionUser]);

  useEffect(() => {
    // Initial verification on mount
    checkSession();

    // Verify once every 6 hours instead of every 60 seconds (massive quota saving)
    const interval = setInterval(() => {
      checkSession(false);
    }, 6 * 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [checkSession]);

  return {
    sessionUser,
    isValidating,
    checkSession,
  };
}
