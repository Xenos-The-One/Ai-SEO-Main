import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Team management. Admins (agency owners/staff) manage who else is an admin. Admins see
 * and manage all agency data; non-admins are limited to what they created. Everything
 * here is admin-only — the very first admin has to be set out of band (a one-off role
 * update in the database), after which admins can promote teammates from the UI.
 */
export const teamRouter = router({
  // List every agency account and its role.
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
  }),

  // Promote a teammate to admin or demote them to a regular member. You can't change
  // your own role, which also guarantees at least one admin always remains.
  setRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "user"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't change your own role.",
        });
      }
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const [updated] = await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId))
        .returning({ id: users.id, role: users.role });
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      return updated;
    }),
});
