import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../../config/appConstants';
import { WORDINGS } from '../../config/wordings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signIn, signUp, signOut,
  setAuthToken, clearAuthToken,
  SUPABASE_URL, SUPABASE_ANON,
} from '../supabaseClient';

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

        // Refresh the access token (they expire after 1 hour in Supabase)
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
      } catch (_) {
        // Token expired or invalid — clear and show login screen
        await clearSession();
        clearAuthToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Sign in ──────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
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
    await signOut();
    await clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
