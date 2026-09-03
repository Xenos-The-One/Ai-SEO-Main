/**
 * Source for the Vercel tRPC serverless function. Bundled by the build step into a single
 * self-contained file at `api/trpc/[[...path]].js` (all app source inlined; only npm
 * packages stay external), because Vercel's per-file ESM compilation leaves cross-directory
 * imports extensionless and Node's ESM resolver then can't find them.
 */
import { createApiApp } from "../server/_core/app";

export default createApiApp();
