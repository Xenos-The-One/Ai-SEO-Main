import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { limitSend } from "../_core/rateLimiters";

export const socialRouter = router({
  // Which social accounts are connected (via the configured provider).
  accounts: protectedProcedure.query(async () => {
    const { getLinkedAccounts } = await import("../lib/social");
    return await getLinkedAccounts();
  }),

  // Publish a post to selected connected accounts. User-triggered from a compose+confirm UI.
  post: protectedProcedure
    .use(limitSend)
    .input(z.object({
      content: z.string().min(1),
      accounts: z.array(z.object({
        platform: z.string(),
        accountId: z.string(),
      })).min(1),
      publishNow: z.boolean().optional(),
      scheduledFor: z.string().optional(),
      timezone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { postToSocial } = await import("../lib/social");
      return await postToSocial(input);
    }),
});

export const newsletterRouter = router({
  send: protectedProcedure
    .use(limitSend)
    .input(z.object({
      subject: z.string().min(1),
      html: z.string().min(1),
      recipients: z.array(z.string().email()).min(1),
      from: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const { sendNewsletter } = await import("../lib/newsletter");
      return await sendNewsletter(input);
    }),
});
