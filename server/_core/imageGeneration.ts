/**
 * Image generation: Gemini for generation + Supabase Storage for hosting.
 *
 * Generates a featured image with the Gemini API, uploads it to the public Supabase Storage
 * bucket, and returns the public URL. All callers wrap this in try/catch and skip the image on
 * failure, so a missing GEMINI_API_KEY / SUPABASE_SERVICE_ROLE_KEY (or a billing/quota error)
 * degrades gracefully to a post with no image.
 */
import { nanoid } from "nanoid";
import { generateImageWithGemini } from "../lib/gemini";
import { uploadImage, extensionForMime } from "../lib/supabaseStorage";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const { base64, mimeType } = await generateImageWithGemini(options.prompt);
  const path = `generated/${nanoid()}.${extensionForMime(mimeType)}`;
  const { url } = await uploadImage(base64, mimeType, path);
  return { url };
}
