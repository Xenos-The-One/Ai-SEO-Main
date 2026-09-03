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

/**
 * Rate-limit middleware factory for paid/expensive endpoints. Buckets are keyed by
 * `name` + the caller (user id when authenticated, else request IP), so all endpoints
 * sharing a `name` share one per-user budget — useful for capping total spend across a
 * class of calls. Throws TOO_MANY_REQUESTS with a retry hint when exceeded.
 */
export function rateLimit(opts: { name: string; limit: number; windowMs: number }) {
  return t.middleware(async ({ ctx, next }) => {
    const who = ctx.user
      ? `u:${ctx.user.id}`
      : `ip:${ctx.req.ip || ctx.req.socket?.remoteAddress || "unknown"}`;
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
