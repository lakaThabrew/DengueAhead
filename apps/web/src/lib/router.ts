/**
 * Lightweight SPA router.
 * No external dependencies — uses window.history.pushState + popstate.
 */
import { useState, useEffect, useCallback } from 'react';

// ── navigate ──────────────────────────────────────────────────────────────────

export function navigate(path: string): void {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// ── useRouter ─────────────────────────────────────────────────────────────────

export interface RouterState {
  pathname: string;
  search: string;
  params: Record<string, string>;
}

export function useRouter(): RouterState & {
  navigate: typeof navigate;
  getParam: (key: string) => string | null;
} {
  const [location, setLocation] = useState({
    pathname: window.location.pathname,
    search: window.location.search
  });

  useEffect(() => {
    const handler = () => {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search
      });
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const getParam = useCallback(
    (key: string): string | null => {
      return new URLSearchParams(location.search).get(key);
    },
    [location.search]
  );

  return {
    pathname: location.pathname,
    search: location.search,
    params: {},
    navigate,
    getParam
  };
}

// ── matchRoute ────────────────────────────────────────────────────────────────
// Returns extracted params if pattern matches pathname, null otherwise.
// Supports :paramName segments.

export function matchRoute(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]!;
    const rp = pathParts[i]!;
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(rp);
    } else if (pp !== rp) {
      return null;
    }
  }
  return params;
}

// ── URL query helpers ─────────────────────────────────────────────────────────

export function getSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export function setSearchParam(key: string, value: string): void {
  const sp = getSearchParams();
  sp.set(key, value);
  navigate(`${window.location.pathname}?${sp.toString()}`);
}

export function deleteSearchParam(key: string): void {
  const sp = getSearchParams();
  sp.delete(key);
  const qs = sp.toString();
  navigate(`${window.location.pathname}${qs ? `?${qs}` : ''}`);
}
