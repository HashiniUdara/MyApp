import { Platform } from 'react-native';

// Supabase's "Reset Password" email link points at the Supabase API, which
// verifies the token and 302-redirects the browser to your app's Site URL
// with the session in the URL fragment:
//   https://your-app.com/#access_token=...&refresh_token=...&type=recovery
//
// On native, the equivalent arrives as a deep link if your Supabase
// "Redirect URLs" allowlist includes your app scheme, e.g.
//   myapp://reset-password#access_token=...&type=recovery
//
// Either way, we just need to pull access_token/refresh_token/type out of
// whatever comes after the first '#'.
function parseTokensFromHash(hash) {
  if (!hash) return null;
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(clean);
  const type = params.get('type');
  if (type !== 'recovery') return null;

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const tokenHash = params.get('token_hash');
  if (!accessToken && !tokenHash) return null;

  return {
    ...(accessToken ? { accessToken } : {}),
    ...(refreshToken ? { refreshToken } : {}),
    ...(tokenHash ? { tokenHash } : {}),
  };
}

// Web: read directly from window.location.hash.
export function extractRecoveryTokensFromWebUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location) return null;
  return parseTokensFromHash(window.location.hash);
}

// Native: a deep link URL looks like `myapp://reset-password#access_token=...`
// (or, on some setups, the tokens end up in the query string instead of the
// hash — check both).
export function extractRecoveryTokensFromUrl(url) {
  if (!url) return null;
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    const fromHash = parseTokensFromHash(url.slice(hashIndex));
    if (fromHash) return fromHash;
  }
  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) {
    const fromQuery = parseTokensFromHash(url.slice(queryIndex + 1));
    if (fromQuery) return fromQuery;
  }
  return null;
}

// Strips the recovery params back out of the URL bar once we've read them,
// so refreshing the page (or re-running this check) doesn't reprocess them.
export function clearWebRecoveryHash() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.history) return;
  const cleanUrl = window.location.pathname + window.location.search;
  window.history.replaceState(null, '', cleanUrl);
}
