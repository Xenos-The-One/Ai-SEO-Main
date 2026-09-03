import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

process.env.SUPABASE_URL = "https://proj.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.SUPABASE_STORAGE_BUCKET = "content-images";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "{}" });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("Supabase Storage upload", () => {
  it("uploads to the bucket with the service_role key and returns the public URL", async () => {
    const { uploadImage } = await import("./supabaseStorage");
    const result = await uploadImage(Buffer.from("hello").toString("base64"), "image/png", "generated/abc.png");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://proj.supabase.co/storage/v1/object/content-images/generated/abc.png");
    expect(init.method).toBe("POST");
    expect(init.headers.authorization).toBe("Bearer service-role-key");
    expect(init.headers["content-type"]).toBe("image/png");
    expect(init.headers["x-upsert"]).toBe("true");
    expect(Buffer.isBuffer(init.body)).toBe(true);

    expect(result.url).toBe("https://proj.supabase.co/storage/v1/object/public/content-images/generated/abc.png");
    expect(result.path).toBe("generated/abc.png");
  });

  it("throws with detail on a failed upload", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403, statusText: "Forbidden", text: async () => "no access" });
    const { uploadImage } = await import("./supabaseStorage");
    await expect(uploadImage("aGk=", "image/png", "p.png")).rejects.toThrow(/403.*no access/);
  });

  it("extensionForMime maps common types", async () => {
    const { extensionForMime } = await import("./supabaseStorage");
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(extensionForMime("image/webp")).toBe("webp");
    expect(extensionForMime("image/png")).toBe("png");
  });
});
