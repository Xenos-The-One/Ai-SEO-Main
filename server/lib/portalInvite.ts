/**
 * Client-portal invitation emails via Resend.
 */
import { ENV } from "../_core/env";

const RESEND_URL = "https://api.resend.com/emails";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type InviteEmailResult = { sent: true } | { sent: false; reason: string };

/**
 * Send a portal invitation. Never throws: the invitation already exists, so a failed send
 * is reported back and the agency can share the link by hand instead.
 */
export async function sendPortalInviteEmail(input: {
  to: string;
  name: string;
  portalName: string;
  link: string;
  expiresAt: Date;
}): Promise<InviteEmailResult> {
  if (!ENV.resendApiKey) return { sent: false, reason: "Email sending isn't configured (RESEND_API_KEY)." };

  const name = escapeHtml(input.name);
  const portal = escapeHtml(input.portalName);
  const link = escapeHtml(input.link);
  const expires = input.expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${ENV.resendApiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: ENV.portalInviteFrom,
        to: [input.to],
        subject: `You're invited to ${input.portalName}`,
        html: `<p>Hi ${name},</p>
<p>You've been invited to <strong>${portal}</strong>, where you can review content and see your performance reports.</p>
<p><a href="${link}">Set your password and sign in</a></p>
<p>This link expires on ${expires}. If it has expired, ask your account manager to resend it.</p>`,
      }),
    });
    if (!response.ok) {
      const json: any = await response.json().catch(() => ({}));
      return { sent: false, reason: json?.message || `Email provider returned ${response.status}` };
    }
    return { sent: true };
  } catch (error: any) {
    return { sent: false, reason: error?.message || "Email request failed" };
  }
}
