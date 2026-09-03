/**
 * Gemini image generation.
 *
 * Uses the Gemini API `generateContent` endpoint with an image-capable model; the response
 * carries the image as inline base64 data. Model is overridable via GEMINI_IMAGE_MODEL.
 */
import { ENV } from "../_core/env";

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

export type GeneratedImage = { base64: string; mimeType: string };

export async function generateImageWithGemini(prompt: string): Promise<GeneratedImage> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": ENV.geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
  }

  const json: any = await response.json();
  const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p?.inlineData?.data || p?.inline_data?.data);
  const inline = imagePart?.inlineData ?? imagePart?.inline_data;

  if (!inline?.data) {
    throw new Error("Gemini returned no image data");
  }

  return {
    base64: inline.data,
    mimeType: inline.mimeType ?? inline.mime_type ?? "image/png",
  };
}
