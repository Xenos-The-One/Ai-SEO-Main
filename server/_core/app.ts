import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";

/**
 * Build the API Express app (tRPC only, no static/vite, no listen). Shared by the
 * persistent server (`_core/index.ts`, for local dev + Node hosts) and the Vercel
 * serverless function (`api/trpc/[[...path]].ts`).
 */
export function createApiApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  return app;
}
