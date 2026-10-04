import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../../config/appConstants';
import { WORDINGS } from '../../config/wordings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signIn, signUp, signOut,
  setAuthToken, clearAuthToken,
  SUPABASE_URL, SUPABASE_ANON,
} from '../supabaseClient';
import { clearUserCache, clearQueue } from '../../utils/offlineStorage';
import { isOnline } from '../../utils/networkStatus';

const AuthContext  = createContext(null);
const SESSION_KEY  = STORAGE_KEYS.session;

// ── AsyncStorage helpers ──────────────────────────────────────────
async function saveSession({ accessToken, refreshToken, user }) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ accessToken, refreshToken, user }));
}
async function loadSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}
async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

// ── Supabase token refresh ────────────────────────────────────────
async function doRefresh(refreshToken) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(WORDINGS.errors.sessionExpired);
  return res.json();  // { access_token, refresh_token, user }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored session

  // ── On app start: restore saved session ──────────────────────
  useEffect(() => {
    (async () => {
      try {
        const session = await loadSession();
        if (!session?.refreshToken) return; // no saved session

        // If the device is offline, skip the refresh attempt entirely —
        // restore the user from the cached session so they stay logged in.
        // The access token will be refreshed the next time connectivity returns.
        if (!(await isOnline())) {
          const u = session.user;
          // Re-use the stored access token even if it may be expired.
          // All API calls are served from local cache offline anyway, so
          // the token is only needed when the device reconnects, at which
          // point the next online session-start will refresh it.
          setAuthToken(session.accessToken ?? '');
          setUser(u);
          return;
        }

        // Online — attempt a proper token refresh
        const refreshed = await doRefresh(session.refreshToken);
        const u = { id: refreshed.user.id, email: refreshed.user.email };
        setAuthToken(refreshed.access_token);
        setUser(u);
        // Save updated tokens back
        await saveSession({
          accessToken:  refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          user: u,
        });
      } catch (err) {
        // Only clear the session for genuine auth failures (HTTP errors,
        // invalid/expired token).  A network-level failure (TypeError:
        // network request failed) means we're offline — keep the session.
        const isNetworkError = err instanceof TypeError ||
          (err.message ?? '').toLowerCase().includes('network');

        if (isNetworkError) {
          // Offline during startup — try to restore from cache without refreshing
          try {
            const session = await loadSession();
            if (session?.user) {
              setAuthToken(session.accessToken ?? '');
              setUser(session.user);
              return;
            }
          } catch { /* nothing stored — fall through to login screen */ }
        }

        // Real auth failure — token invalid or expired
        await clearSession();
        clearAuthToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Sign in ──────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    // Guard: can't sign in for the first time without connectivity
    if (!(await isOnline())) {
      throw new Error(WORDINGS.errors.offlineLogin ?? 'You are offline. Please connect to the internet to sign in.');
    }
    const data = await signIn(email, password);
    if (data.user) {
      const u = { id: data.user.id, email: data.user.email };
      setUser(u);
      await saveSession({
        accessToken:  data.access_token,
        refreshToken: data.refresh_token,
        user: u,
      });
    }
    return data;
  }, []);

  // ── Sign up (no auto-login — email confirmation required) ────
  const register = useCallback(async (email, password) => {
    return await signUp(email, password);
  }, []);

  // ── Sign out ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const uid = user?.id;
    await signOut();
    await clearSession();
    if (uid) {
      await clearUserCache(uid);
      await clearQueue(uid);
    }
    setUser(null);
  }, [user]);

  // ── Refresh token when app comes back online ──────────────────
  // If the user was restored from cache (offline startup), their access
  // token may be stale.  Re-run a proper refresh once connectivity returns.
  const refreshSessionIfNeeded = useCallback(async () => {
    if (!user) return;
    try {
      const session = await loadSession();
      if (!session?.refreshToken) return;
      const refreshed = await doRefresh(session.refreshToken);
      const u = { id: refreshed.user.id, email: refreshed.user.email };
      setAuthToken(refreshed.access_token);
      setUser(u);
      await saveSession({
        accessToken:  refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        user: u,
      });
    } catch {
      // If this fails it just means the token is still valid or we're still offline
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshSessionIfNeeded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
