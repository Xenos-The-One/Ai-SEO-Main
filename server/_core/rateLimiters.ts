import { rateLimit } from "./trpc";

/**
 * Shared rate-limit tiers for paid endpoints (per user). Endpoints that share a tier
 * share one budget, which caps total spend across a class of calls rather than letting
 * each endpoint be maxed independently.
 *
 * Limits are deliberately generous for normal use and only bite on runaway loops or abuse.
 */

/**
 * Single LLM generation/analysis calls (content gen/regen, keyword optimize, quality/SEO analysis, repurpose).
 * Sized to comfortably generate ~100 posts one-by-one in a sitting, with headroom for regenerations.
 */
export const limitLlmSingle = rateLimit({ name: "llm-single", limit: 150, windowMs: 60_000 });

/**
 * Batch/fan-out LLM jobs that each spend a lot in one call (bulk gen, AI-visibility scan, recurring run, A/B test).
 * One bulk call can itself produce ~100 posts, so this caps the number of such jobs, not posts.
 */
export const limitLlmBatch = rateLimit({ name: "llm-batch", limit: 30, windowMs: 5 * 60_000 });

/** DataForSEO + crawler/PageSpeed lookups. Cheap per call — allow heavy real use. */
export const limitData = rateLimit({ name: "data", limit: 600, windowMs: 60_000 });

/** Outbound sends (email newsletter, social posting) — high ceiling, only bites on abuse. */
export const limitSend = rateLimit({ name: "send", limit: 500, windowMs: 60 * 60_000 });
