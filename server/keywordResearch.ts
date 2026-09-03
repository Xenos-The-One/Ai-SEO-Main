/**
 * Keyword Research Module
 * Provides keyword suggestions, search volume, and difficulty metrics
 */

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number; // 0-100
  cpc?: number;
  competition?: string;
  trend?: "rising" | "stable" | "declining";
}

export interface KeywordSuggestion {
  keyword: string;
  relevance: number; // 0-100
  searchVolume: number;
  difficulty: number;
}

/**
 * Get keyword suggestions with real search volume + difficulty from DataForSEO.
 * Results come back ranked by relevance, which we surface as a rank-based relevance score.
 * Throws if DataForSEO isn't configured — we no longer fabricate metrics.
 */
export async function getKeywordSuggestions(
  topic: string,
  count: number = 10
): Promise<KeywordSuggestion[]> {
  const { keywordSuggestions } = await import("./lib/dataforseo");

  const results = await keywordSuggestions(topic, { limit: Math.max(count, 10) });

  return results.slice(0, count).map((k, index) => ({
    keyword: k.keyword,
    // The API returns suggestions in relevance order; derive a descending relevance score.
    relevance: Math.max(40, Math.round(100 - (index * 60) / Math.max(count, 1))),
    searchVolume: k.searchVolume,
    difficulty: k.difficulty,
  }));
}

/**
 * Analyze content and suggest keyword optimizations
 */
export async function analyzeContentKeywords(
  content: string,
  targetKeywords: string[]
): Promise<{
  keywordDensity: Record<string, number>;
  suggestions: string[];
  score: number;
}> {
  const wordCount = content.split(/\s+/).length;
  const contentLower = content.toLowerCase();

  // Calculate keyword density
  const keywordDensity: Record<string, number> = {};
  for (const keyword of targetKeywords) {
    const regex = new RegExp(keyword.toLowerCase(), "gi");
    const matches = content.match(regex);
    const count = matches ? matches.length : 0;
    keywordDensity[keyword] = (count / wordCount) * 100;
  }

  // Generate optimization suggestions
  const suggestions: string[] = [];
  for (const [keyword, density] of Object.entries(keywordDensity)) {
    if (density === 0) {
      suggestions.push(`Add the keyword "${keyword}" to your content (currently not present)`);
    } else if (density < 0.5) {
      suggestions.push(`Increase usage of "${keyword}" (current density: ${density.toFixed(2)}%, recommended: 0.5-2%)`);
    } else if (density > 3) {
      suggestions.push(`Reduce usage of "${keyword}" to avoid keyword stuffing (current density: ${density.toFixed(2)}%, recommended: 0.5-2%)`);
    }
  }

  // Calculate SEO score (0-100)
  let score = 50; // Base score

  // Bonus for keyword presence
  const presentKeywords = Object.values(keywordDensity).filter(d => d > 0).length;
  score += (presentKeywords / targetKeywords.length) * 30;

  // Bonus for optimal density
  const optimalKeywords = Object.values(keywordDensity).filter(d => d >= 0.5 && d <= 2).length;
  score += (optimalKeywords / targetKeywords.length) * 20;

  // Penalty for keyword stuffing
  const stuffedKeywords = Object.values(keywordDensity).filter(d => d > 3).length;
  score -= stuffedKeywords * 10;

  score = Math.max(0, Math.min(100, score));

  return {
    keywordDensity,
    suggestions,
    score: Math.round(score)
  };
}

/**
 * Optimize content for target keywords using AI
 */
export async function optimizeContentForKeywords(
  content: string,
  targetKeywords: string[]
): Promise<string> {
  const { invokeLLM } = await import("./_core/llm");

  const prompt = `You are an SEO content optimization expert. Optimize the following content to naturally include these target keywords while maintaining readability and quality.

Target Keywords: ${targetKeywords.join(", ")}

Original Content:
${content}

Instructions:
1. Naturally incorporate the target keywords throughout the content
2. Maintain the original meaning and structure
3. Ensure keyword density is between 0.5-2% for each keyword
4. Keep the content readable and engaging
5. Don't force keywords where they don't fit naturally
6. Return ONLY the optimized content, no explanations

Optimized Content:`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an SEO content optimization expert. Return only the optimized content, no explanations or meta-commentary." },
        { role: "user", content: prompt }
      ]
    });

    const responseContent = response.choices[0]?.message?.content;
    const optimizedContent = typeof responseContent === 'string' ? responseContent.trim() : content;
    return optimizedContent || content;
  } catch (error) {
    console.error("Content optimization failed:", error);
    return content;
  }
}
