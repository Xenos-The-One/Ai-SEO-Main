import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

process.env.ZERNIO_API_KEY = "sk_testkey";
process.env.RESEND_API_KEY = "resend-key";
process.env.NEWSLETTER_FROM = "news@example.com";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("social posting (Zernio)", () => {
  it("posts to /posts with Bearer auth, account targets, and publishNow", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ post: { _id: "p1", status: "published", platforms: [{ platform: "twitter", platformPostUrl: "https://x.com/p/1" }] } }),
    });
    const { postToSocial } = await import("./social");
    const res = await postToSocial({ content: "Hello world", accounts: [{ platform: "twitter", accountId: "acc1" }], publishNow: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://zernio.com/api/v1/posts");
    expect(init.headers.authorization).toBe("Bearer sk_testkey");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ content: "Hello world", platforms: [{ platform: "twitter", accountId: "acc1" }], publishNow: true });
    expect(res.status).toBe("published");
    expect(res.postUrls[0]).toEqual({ platform: "twitter", url: "https://x.com/p/1" });
  });

  it("surfaces Zernio error responses", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, statusText: "Bad Request", json: async () => ({ message: "invalid account" }) });
    const { postToSocial } = await import("./social");
    await expect(postToSocial({ content: "x", accounts: [{ platform: "twitter", accountId: "a" }] })).rejects.toThrow(/invalid account/);
  });

  it("getLinkedAccounts maps _id to id", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ accounts: [{ _id: "a1", platform: "twitter" }, { _id: "a2", platform: "linkedin" }] }) });
    const { getLinkedAccounts } = await import("./social");
    expect(await getLinkedAccounts()).toEqual([{ id: "a1", platform: "twitter" }, { id: "a2", platform: "linkedin" }]);
  });
});

describe("newsletter (Resend)", () => {
  it("sends via BCC with the sender in to, and returns recipient count", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "email_123" }) });
    const { sendNewsletter } = await import("./newsletter");
    const res = await sendNewsletter({ subject: "Hi", html: "<p>Hi</p>", recipients: ["a@x.com", "b@x.com"] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.authorization).toBe("Bearer resend-key");
    const body = JSON.parse(init.body);
    expect(body.from).toBe("news@example.com");
    expect(body.to).toEqual(["news@example.com"]);
    expect(body.bcc).toEqual(["a@x.com", "b@x.com"]);
    expect(res).toEqual({ id: "email_123", recipientCount: 2 });
  });

  it("rejects when there are no recipients", async () => {
    const { sendNewsletter } = await import("./newsletter");
    await expect(sendNewsletter({ subject: "s", html: "<p>x</p>", recipients: [] })).rejects.toThrow(/recipient/i);
  });
});
