/**
 * networkStatus.js
 *
 * Lightweight online/offline detection that works without installing
 * @react-native-community/netinfo.
 *
 * Strategy: send a HEAD request to a tiny, reliable endpoint.
 * We use the Supabase REST root because it's the same domain the app
 * already talks to — no extra firewall rules needed.
 *
 * isOnline()  → Promise<boolean>   (one-shot check)
 * useNetwork() → { online }        (React hook that re-checks on
 *                                   AppState change and interval)
 */

import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { SUPABASE_URL } from '../store/supabaseClient';

const PROBE_URL     = `${SUPABASE_URL}/rest/v1/`;
const PROBE_TIMEOUT = 4000; // ms

/**
 * Returns true when a quick HEAD request to the Supabase endpoint
 * succeeds (status < 600 — even 401 means the server is reachable).
 */
export async function isOnline() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
    const res = await fetch(PROBE_URL, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.status < 600;
  } catch {
    return false;
  }
}

/**
 * React hook — returns { online: boolean }.
 * Re-evaluates when the app comes to the foreground and every 30 s.
 */
export function useNetwork() {
  const [online, setOnline] = useState(true); // optimistic default
  const timerRef = useRef(null);

  const check = async () => {
    const result = await isOnline();
    setOnline(result);
  };

  useEffect(() => {
    check(); // immediate check on mount

    // Re-check whenever the app returns to foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    // Periodic background check every 30 s
    timerRef.current = setInterval(check, 30_000);

    return () => {
      sub.remove();
      clearInterval(timerRef.current);
    };
  }, []);

  return { online };
}
