import { eq, type AnyColumn, type SQL } from "drizzle-orm";

/**
 * Access model for this agency tool: it's a single shared book of business. Any
 * owner/admin can see and manage everything — every client, content item, audit, etc. —
 * no matter which staff member created it. Non-admin accounts are limited to rows they
 * created. `createdBy` always records the real author, so switching to admin never loses
 * attribution; it only widens who can see a row.
 *
 * The id-based counterpart used by data-layer helpers and guards is `isAgencyAdmin` in
 * `./db` (it needs a database handle, which lives there).
 */

/** Whether this role may access the whole agency's data rather than only its own rows. */
export function canAccessAllData(user: { role: string }): boolean {
  return user.role === "admin";
}

/**
 * Row-visibility predicate for a `createdBy` column, for callers whose role is already
 * loaded (e.g. `ctx.user`). Returns `undefined` for admins so drizzle applies no
 * restriction; otherwise restricts to the caller's own rows. `undefined` is safe both as
 * the sole `.where(...)` argument and nested inside `and(...)`.
 */
export function ownScope(user: { id: number; role: string }, createdBy: AnyColumn): SQL | undefined {
  return canAccessAllData(user) ? undefined : eq(createdBy, user.id);
}
