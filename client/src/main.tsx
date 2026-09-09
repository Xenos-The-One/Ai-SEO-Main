import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { LOGIN_PATH } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Portal pages have their own login and Bearer-token auth; keep them out of the agency flow.
  const onPortal = window.location.pathname.startsWith("/portal");
  const target = onPortal ? "/portal/login" : LOGIN_PATH;

  // Avoid redirect loop when already on the login page.
  if (window.location.pathname === target) return;

  if (onPortal) {
    try {
      localStorage.removeItem("client_portal_token");
      localStorage.removeItem("client_portal_user");
    } catch {}
  }

  window.location.href = target;
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        const headers = new Headers(init?.headers);
        // On portal pages, authenticate with the client-portal Bearer token instead of the
        // agency session cookie. Agency pages keep using the cookie (no token attached).
        try {
          if (window.location.pathname.startsWith("/portal")) {
            const token = localStorage.getItem("client_portal_token");
            if (token) headers.set("authorization", `Bearer ${token}`);
          }
        } catch {}
        return globalThis.fetch(input, {
          ...(init ?? {}),
          headers,
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
