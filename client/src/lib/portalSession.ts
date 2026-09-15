/**
 * Client-portal session storage.
 *
 * Uses `sessionStorage` (scoped to a single browser tab) rather than `localStorage`
 * (shared across every tab on the origin) so the agency owner can preview several
 * clients' portals in different tabs at once without one clobbering another.
 *
 * The preview flow ("Open Portal") opens a new tab and hands it the session through
 * the URL hash — see `bootstrapPortalSessionFromUrl` — because a freshly opened tab
 * starts with its own empty sessionStorage.
 */

const TOKEN_KEY = "client_portal_token";
const USER_KEY = "client_portal_user";

export type PortalUser = {
  id: number;
  clientId: number;
  email: string;
  name: string;
  role: string;
};

export function getPortalToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getPortalUserRaw(): string | null {
  try {
    return sessionStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export function getPortalUser(): PortalUser | null {
  const raw = getPortalUserRaw();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortalUser;
  } catch {
    return null;
  }
}

export function setPortalSession(token: string, user: unknown): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function clearPortalSession(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {}
}

/** Build the URL hash used to hand a portal session to a newly opened tab. */
export function buildPortalSessionHash(token: string, user: unknown): string {
  const params = new URLSearchParams({ pt: token, pu: JSON.stringify(user) });
  return `#${params.toString()}`;
}

/**
 * Seed this tab's portal session from a `#pt=…&pu=…` URL hash (used by the preview
 * flow) or, one-time, migrate a legacy `localStorage` session left by an older build.
 * Strips the hash afterwards so the token never lingers in the address bar. Safe to
 * call on every load; a no-op when there is nothing to import.
 */
export function bootstrapPortalSessionFromUrl(): void {
  try {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    if (hash) {
      const params = new URLSearchParams(hash);
      const token = params.get("pt");
      const user = params.get("pu");
      if (token && user) {
        sessionStorage.setItem(TOKEN_KEY, token);
        sessionStorage.setItem(USER_KEY, user);
        params.delete("pt");
        params.delete("pu");
        const rest = params.toString();
        const newUrl = window.location.pathname + window.location.search + (rest ? `#${rest}` : "");
        window.history.replaceState(null, "", newUrl);
        return;
      }
    }

    // One-time migration from the old shared-localStorage sessions.
    if (!sessionStorage.getItem(TOKEN_KEY)) {
      const legacyToken = localStorage.getItem(TOKEN_KEY);
      const legacyUser = localStorage.getItem(USER_KEY);
      if (legacyToken && legacyUser) {
        sessionStorage.setItem(TOKEN_KEY, legacyToken);
        sessionStorage.setItem(USER_KEY, legacyUser);
      }
      // Drop the shared copy either way so future tabs stay isolated.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch {}
}
