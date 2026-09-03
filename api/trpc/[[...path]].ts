/**
 * Vercel serverless entry for the tRPC API. Vercel routes every `/api/trpc/*` request to
 * this optional catch-all function; the exported Express app (mounted at `/api/trpc`)
 * handles it. Env vars come from the Vercel project settings, not a local `.env`.
 */
import { createApiApp } from "../../server/_core/app";

export default createApiApp();
