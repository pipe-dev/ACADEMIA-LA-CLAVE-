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

  const kickOut = useCallback((reason: 'blocked' | 'expired' | 'ended') => {
    if (isKickingRef.current) return;
    isKickingRef.current = true;
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_LAST_CHECK);
      localStorage.removeItem(STORAGE_KEY_SERVER_TIME);
    } catch {}
    window.location.href = `/login?reason=${reason}`;
  }, []);

  const checkSession = useCallback(async (force = false) => {
    if (isKickingRef.current) return;

    const currentUser = sessionUserRef.current;
    const now = Date.now();
    const lastCheck = Number(localStorage.getItem(STORAGE_KEY_LAST_CHECK) || 0);
    const lastServerTime = Number(localStorage.getItem(STORAGE_KEY_SERVER_TIME) || 0);

    // Anti-tamper check: clock set backward by more than 2 minutes
    const isClockTampered = lastServerTime > 0 && now < (lastServerTime - 120000);

    // Immediate local expiration evaluation
    if (currentUser?.expiresAt) {
      const expiry = new Date(currentUser.expiresAt).getTime();
      if (now >= expiry) {
        kickOut('expired');
        return;
      }
      const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
      if (daysRemaining !== currentUser.daysRemaining) {
        setSessionUser((prev) => (prev ? { ...prev, daysRemaining } : null));
      }
    }

    // High-frequency license check: check server if forced, tampered, or > 12s since last check
    const HEARTBEAT_WINDOW_MS = 12 * 1000;
    const shouldCheckServer = force || isClockTampered || (now - lastCheck > HEARTBEAT_WINDOW_MS);

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
        const data = await res.json().catch(() => ({}));
        const reason = data.reason === 'blocked' ? 'blocked' : (data.reason === 'expired' ? 'expired' : 'ended');
        kickOut(reason);
        return;
      }

      const data = await res.json();
      if (!data.authenticated || !data.user) {
        const reason = data.reason === 'blocked' ? 'blocked' : (data.reason === 'expired' ? 'expired' : 'ended');
        kickOut(reason);
        return;
      }

      const serverNow = data.serverTime ? new Date(data.serverTime).getTime() : now;
      const expiryTime = new Date(data.user.expiresAt).getTime();

      if (serverNow >= expiryTime || data.user.daysRemaining <= 0) {
        kickOut('expired');
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
          kickOut('expired');
        }
        return;
      }
    } finally {
      setIsValidating(false);
    }
  }, [kickOut]);

  useEffect(() => {
    // Initial verification on mount
    checkSession(true);

    // 1. Cross-tab real-time session revocation via BroadcastChannel
    let authChannel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        authChannel = new BroadcastChannel('afinapp_auth_channel');
        authChannel.onmessage = (event) => {
          const payload = event.data;
          if (!payload) return;
          const current = sessionUserRef.current;
          if (
            payload.type === 'SESSION_REVOKED' &&
            current &&
            (payload.email === current.email || payload.userId === current.id)
          ) {
            const reason = payload.status === 'blocked' ? 'blocked' : 'expired';
            kickOut(reason);
          } else if (payload.type === 'FORCE_SESSION_CHECK') {
            checkSession(true);
          }
        };
      }
    } catch {}

    // 2. Storage event listener for cross-window notification
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'afinapp_session_revoked_event' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          const current = sessionUserRef.current;
          if (current && (payload.email === current.email || payload.userId === current.id)) {
            const reason = payload.status === 'blocked' ? 'blocked' : 'expired';
            kickOut(reason);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Real-time heartbeat interval every 12 seconds to detect server revocations
    const heartbeatTimer = setInterval(() => {
      checkSession(true);
    }, 12000);

    // 4. Instant check when returning to app / tab / window
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession(true);
      }
    };
    const handleFocus = () => {
      checkSession(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      if (authChannel) {
        try {
          authChannel.close();
        } catch {}
      }
    };
  }, [checkSession, kickOut]);

  return {
    sessionUser,
    isValidating,
    checkSession,
  };
}
