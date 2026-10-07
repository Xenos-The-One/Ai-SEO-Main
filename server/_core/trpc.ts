import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { checkRateLimit } from "./rateLimit";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

const requirePortalUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.portalUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      portalUser: ctx.portalUser,
    },
  });
});

/** Authenticated as a client-portal user (Bearer token). Scoped to `ctx.portalUser.clientId`. */
export const portalProcedure = t.procedure.use(requirePortalUser);

/**
 * The caller's IP. Behind Vercel the socket address is the platform proxy, so use
 * `x-real-ip`, which Vercel sets to the client address and overwrites if a client sends it.
 * Elsewhere there's no trusted proxy, so forwarding headers are ignored (they're spoofable).
 */
export function clientIp(req: TrpcContext["req"]): string {
  if (process.env.VERCEL) {
    const real = req.headers["x-real-ip"];
    if (typeof real === "string" && real) return real;
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * Rate-limit middleware factory for paid/expensive endpoints. Buckets are keyed by
 * `name` + the caller (user id when authenticated, else request IP), so all endpoints
 * sharing a `name` share one per-user budget — useful for capping total spend across a
 * class of calls. Throws TOO_MANY_REQUESTS with a retry hint when exceeded.
 */
export function rateLimit(opts: { name: string; limit: number; windowMs: number }) {
  return t.middleware(async ({ ctx, next }) => {
    const who = ctx.user ? `u:${ctx.user.id}` : `ip:${clientIp(ctx.req)}`;
    const result = checkRateLimit(`${opts.name}:${who}`, opts.limit, opts.windowMs);
    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${result.retryAfterSeconds}s.`,
      });
    }
    return next();
  });
}

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
