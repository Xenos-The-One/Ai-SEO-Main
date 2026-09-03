export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
/** Absolute session lifetime (sliding). A token unused for this long expires. */
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
/** Re-issue a fresh token once the current one is older than this, keeping active users signed in. */
export const SESSION_REFRESH_AFTER_MS = 1000 * 60 * 60 * 24; // 1 day
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
