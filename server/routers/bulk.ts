import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createContent } from "../db";
import { invokeLLM, DEFAULT_TEXT_MODEL } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import { assertClient } from "../authz";
import { limitLlmBatch } from "../_core/rateLimiters";

export const bulkRouter = router({
  generate: protectedProcedure
    .use(limitLlmBatch)
    .input(z.object({
      clientId: z.number(),
      topics: z.array(z.string().min(1)).min(1).max(100),
      customPrompt: z.string().optional(),
      shouldGenerateImage: z.boolean().default(true),
      aiModel: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { clientId, topics, customPrompt, shouldGenerateImage, aiModel } = input;
      await assertClient(ctx.user.id, clientId);
      const { assertClientWithinBudget } = await import("../budgetTracking");
      await assertClientWithinBudget(clientId);
      const results: any[] = [];

      for (const topic of topics) {
        try {
          let inputTokens = 0;
          let outputTokens = 0;

          const systemPrompt = customPrompt || "You are an expert SEO content writer. Create engaging, well-structured blog posts that are informative and optimized for search engines.";
          const userPrompt = `Write a comprehensive blog post about: ${topic}`;

          const llmResponse = await invokeLLM({
            model: aiModel || DEFAULT_TEXT_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });

          const messageContent = llmResponse.choices[0]?.message?.content;
          const generatedContent = typeof messageContent === 'string' ? messageContent : "";
          inputTokens = llmResponse.usage?.prompt_tokens || 0;
          outputTokens = llmResponse.usage?.completion_tokens || 0;

          const lines = generatedContent.split("\n").filter((l: string) => l.trim());
          const title = lines[0]?.replace(/^#\s*/, "").substring(0, 500) || topic;

          let imageUrl = "";
          let imagePrompt = "";
          if (shouldGenerateImage) {
            try {
              imagePrompt = `Professional blog header image for: ${topic}`;
              const imageResult = await generateImage({ prompt: imagePrompt });
              imageUrl = imageResult.url || "";
            } catch (error) {
              console.error("Image generation failed:", error);
            }
          }

          const contentId = await createContent({
            clientId,
            createdBy: ctx.user.id,
            title,
            topic,
            content: generatedContent,
            imageUrl,
            imagePrompt,
            status: "draft",
            progress: 75,
            aiModel: aiModel || DEFAULT_TEXT_MODEL,
            customPrompt: customPrompt || null,
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
          });

          results.push({ topic, success: true, contentId });
        } catch (error) {
          results.push({ topic, success: false, error: String(error) });
        }
      }

      return { results, totalGenerated: results.filter((r: any) => r.success).length };
    }),
});
