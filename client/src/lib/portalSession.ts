/**
 * Client-portal session storage.
 *
 * Real client logins persist in `localStorage` so the session survives closing the tab,
 * opening links in new tabs, and clicking links from emails.
 *
 * Agency owner previews ("Open Portal") live in `sessionStorage` (scoped to one tab) so
 * the owner can preview several clients side by side without clobbering each other or a
 * real login. The preview tab receives its session through the URL hash — see
 * `bootstrapPortalSessionFromUrl` — because a freshly opened tab starts with empty
 * sessionStorage. A tab-scoped preview session always takes precedence.
 */

const TOKEN_KEY = "client_portal_token";
const USER_KEY = "client_portal_user";
/** The client's branded login slug, kept after logout so we can send them back to it. */
const SLUG_KEY = "client_portal_slug";

export type PortalUser = {
  id: number;
  clientId: number;
  email: string;
  name: string;
  role: string;
  slug?: string | null;
};

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  } catch {
    return null;
  }
}

function isPreviewTab(): boolean {
  try {
    return !!sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return false;
  }
}

export function getPortalToken(): string | null {
  return read(TOKEN_KEY);
}

export function getPortalUserRaw(): string | null {
  return read(USER_KEY);
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

/** Store a real client login (persists across tabs and browser restarts). */
export function setPortalSession(token: string, user: PortalUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (user.slug) localStorage.setItem(SLUG_KEY, user.slug);
  } catch {}
}

/** Clear this tab's session: the preview session if one is active, else the real login. */
export function clearPortalSession(): void {
  try {
    const store = isPreviewTab() ? sessionStorage : localStorage;
    store.removeItem(TOKEN_KEY);
    store.removeItem(USER_KEY);
  } catch {}
}

/** Where to send a signed-out user: their branded login page when we know it. */
export function portalLoginPath(): string {
  let slug = getPortalUser()?.slug ?? null;
  if (!slug) {
    try {
      slug = localStorage.getItem(SLUG_KEY);
    } catch {}
  }
  return slug ? `/portal/${encodeURIComponent(slug)}` : "/portal/login";
}

/** Build the URL hash used to hand a portal session to a newly opened tab. */
export function buildPortalSessionHash(token: string, user: unknown): string {
  const params = new URLSearchParams({ pt: token, pu: JSON.stringify(user) });
  return `#${params.toString()}`;
}

/**
 * Seed this tab's preview session from a `#pt=…&pu=…` URL hash (used by "Open Portal"),
 * then strip the hash so the token never lingers in the address bar. Safe to call on
 * every load; a no-op when there is nothing to import.
 */
export function bootstrapPortalSessionFromUrl(): void {
  try {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const token = params.get("pt");
    const user = params.get("pu");
    if (!token || !user) return;
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, user);
    params.delete("pt");
    params.delete("pu");
    const rest = params.toString();
    const newUrl = window.location.pathname + window.location.search + (rest ? `#${rest}` : "");
    window.history.replaceState(null, "", newUrl);
  } catch {}
}
