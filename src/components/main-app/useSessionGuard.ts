import { useEffect, useState, useCallback, useRef } from 'react';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  expiresAt: string;
  daysRemaining: number;
  role: 'student' | 'admin';
}

export function useSessionGuard() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const isKickingRef = useRef<boolean>(false);

  const checkSession = useCallback(async () => {
    if (isKickingRef.current) return;

    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!res.ok) {
        isKickingRef.current = true;
        const data = await res.json().catch(() => ({}));
        const reason = data.reason === 'blocked' ? 'blocked' : (data.reason === 'expired' ? 'expired' : 'ended');
        window.location.href = `/login?reason=${reason}`;
        return;
      }

      const data = await res.json();
      if (!data.authenticated || !data.user) {
        isKickingRef.current = true;
        const reason = data.reason === 'blocked' ? 'blocked' : (data.reason === 'expired' ? 'expired' : 'ended');
        window.location.href = `/login?reason=${reason}`;
        return;
      }

      setSessionUser(data.user);
    } catch (e) {
      // In case of network disconnection while offline, do not kick immediately if offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    // Initial verification
    checkSession();

    // Periodic heartbeat every 60 seconds to detect real-time expiration
    const interval = setInterval(checkSession, 60000);

    // Also check immediately when student returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkSession]);

  return {
    sessionUser,
    isValidating,
    checkSession,
  };
}
