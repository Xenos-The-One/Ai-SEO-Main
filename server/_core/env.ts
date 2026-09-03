/**
 * Treat unfilled `.env` placeholders like "[YOUR-ANTHROPIC-API-KEY]" as unset, so a provider
 * without a real key is never considered configured (which would otherwise 401 at runtime).
 */
const clean = (value: string | undefined): string => {
  const s = (value ?? "").trim();
  return /^\[.*\]$/.test(s) ? "" : s;
};

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  anthropicApiKey: clean(process.env.ANTHROPIC_API_KEY),
  dataForSeoLogin: clean(process.env.DATAFORSEO_LOGIN),
  dataForSeoPassword: clean(process.env.DATAFORSEO_PASSWORD),
  pageSpeedApiKey: clean(process.env.PAGESPEED_API_KEY),
  geminiApiKey: clean(process.env.GEMINI_API_KEY),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "content-images",
  zernioApiKey: clean(process.env.ZERNIO_API_KEY),
  resendApiKey: clean(process.env.RESEND_API_KEY),
  newsletterFrom: process.env.NEWSLETTER_FROM ?? "onboarding@resend.dev",
  openaiApiKey: clean(process.env.OPENAI_API_KEY),
  perplexityApiKey: clean(process.env.PERPLEXITY_API_KEY),
};
