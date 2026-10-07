import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

process.env.RESEND_API_KEY = "resend-key";
process.env.PORTAL_INVITE_FROM = "portal@example.com";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const invite = {
  to: "dana@client.test",
  name: "Dana <b>",
  portalName: "Harbor & Co Portal",
  link: "https://app.test/portal/accept-invitation?token=abc",
  expiresAt: new Date("2026-10-09T12:00:00Z"),
};

describe("sendPortalInviteEmail", () => {
  it("emails the invite link from the portal sender, with names HTML-escaped", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "e1" }) });
    const { sendPortalInviteEmail } = await import("./portalInvite");
    const res = await sendPortalInviteEmail(invite);

    expect(res).toEqual({ sent: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(init.body);
    expect(body.from).toBe("portal@example.com");
    expect(body.to).toEqual(["dana@client.test"]);
    expect(body.subject).toBe("You're invited to Harbor & Co Portal");
    expect(body.html).toContain('href="https://app.test/portal/accept-invitation?token=abc"');
    expect(body.html).toContain("Dana &lt;b&gt;");
    expect(body.html).toContain("Harbor &amp; Co Portal");
  });

  it("reports a provider rejection instead of throwing", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: "Domain not verified" }) });
    const { sendPortalInviteEmail } = await import("./portalInvite");
    expect(await sendPortalInviteEmail(invite)).toEqual({ sent: false, reason: "Domain not verified" });
  });

  it("reports a network failure instead of throwing", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNRESET"));
    const { sendPortalInviteEmail } = await import("./portalInvite");
    expect(await sendPortalInviteEmail(invite)).toEqual({ sent: false, reason: "ECONNRESET" });
  });
});
