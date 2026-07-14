import { SUPABASE_CONFIG } from '../config/supabaseConfig';
import { WORDINGS } from '../config/wordings';

export const SUPABASE_URL = SUPABASE_CONFIG.url;
export const SUPABASE_ANON = SUPABASE_CONFIG.anonKey;

// ── Auth token storage ─────────────────────────────────────────────
let _accessToken = null;

export function setAuthToken(token) { _accessToken = token; }
export function clearAuthToken()    { _accessToken = null;  }
export function getAuthToken()      { return _accessToken;  }

// ── Auth API calls ─────────────────────────────────────────────────
async function authPost(endpoint, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'apikey':       SUPABASE_ANON,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || WORDINGS.errors.auth);
  return data;
}

export async function signUp(email, password) {
  const data = await authPost('signup', { email, password });
  if (data.access_token) setAuthToken(data.access_token);
  return data;
}

export async function signIn(email, password) {
  const data = await authPost('token?grant_type=password', { email, password });
  if (data.access_token) setAuthToken(data.access_token);
  return data;
}

export async function signOut() {
  const token = _accessToken;
  clearAuthToken();
  if (!token) return;
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
  }).catch(() => {});
}

export async function resetPassword(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error_description || data.msg || 'Failed to send reset email');
  }
}

// ── Database query ─────────────────────────────────────────────────
export async function dbQuery(table, options = {}) {
  const {
    method  = 'GET',
    body,
    filters = [],   // ['col=eq.val', 'col2=eq.val2']
    order,
    select  = '*',
    single  = false,
  } = options;

  // Build URL — filters go directly into the query string for Supabase
  // Each filter is already in Supabase format: "column=operator.value"
  // e.g. "id=eq.123"  →  ?id=eq.123
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  if (order)  url += `&order=${encodeURIComponent(order)}`;
  if (single) url += `&limit=1`;
  filters.forEach(f => {
    const eqIdx = f.indexOf('=');
    const col = f.slice(0, eqIdx);
    const val = f.slice(eqIdx + 1);
    url += `&${encodeURIComponent(col)}=${encodeURIComponent(val)}`;
  });

  const token = _accessToken ?? SUPABASE_ANON;

  const headers = {
    'apikey':        SUPABASE_ANON,
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json',
  };
  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    headers['Prefer'] = 'return=representation';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`[${method} ${table}] ${res.status}: ${msg}`);
  }

  if (res.status === 204 || method === 'DELETE') return null;
  const data = await res.json();
  return single ? (data[0] ?? null) : data;
}

// ── Set new password using access token from reset link ───────────
export async function setNewPassword(accessToken, newPassword) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'apikey':        SUPABASE_ANON,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ password: newPassword }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error_description || data.msg || 'Failed to update password');
  }
  return res.json();
}

// ── Exchange recovery token for a session ────────────────────────
export async function verifyRecoveryToken(tokenHash) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ token_hash: tokenHash, type: 'recovery' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || 'Invalid or expired link');
  if (data.access_token) setAuthToken(data.access_token);
  return data;
}

// ── Aliases / extra exports expected by AuthScreen.js + financeApi.js ──

// Same call as resetPassword() above — just also lets the caller pass a
// redirect_to tells Supabase where to send the user after they click
// the link in the email.
// • Web (Expo dev): http://localhost:19006
// • Native (APK):   myapp://reset-password
export async function requestPasswordReset(email) {
  const { Platform } = require('react-native');

  let redirectTo;
  if (Platform.OS === 'web') {
    // On web, redirect back to the same origin so the browser tab handles it
    redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}`
      : 'http://localhost:19006';
  } else {
    // On native, open the app via deep link
    redirectTo = 'myapp://reset-password';
  }

  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error_description || data.msg || WORDINGS.errors.auth);
  }
  return true;
}

// Manual-code variant of verifyRecoveryToken: used by AuthScreen's in-app
// "forgot password" flow, where the user types in the code emailed to
// them (email + token) rather than arriving via the link (token_hash).
export async function verifyPasswordResetCode(email, token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'recovery', email, token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || WORDINGS.errors.invalidResetCode);
  if (data.access_token) setAuthToken(data.access_token);
  return data; // { access_token, refresh_token, user }
}

// ── Postgres function (RPC) calls — used by store/financeApi.js ────
export async function rpcQuery(fn, args = {}) {
  const token = _accessToken ?? SUPABASE_ANON;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'apikey':        SUPABASE_ANON,
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`[RPC ${fn}] ${res.status}: ${msg}`);
  }

  if (res.status === 204) return null;
  return res.json();
}
