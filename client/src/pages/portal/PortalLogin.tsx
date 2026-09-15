import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { setPortalSession } from "@/lib/portalSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { LogIn } from "lucide-react";

export default function PortalLogin() {
  const [, setLocation] = useLocation();

  // Branded per-client login is served at /portal/:slug. The reserved portal
  // routes are matched earlier in the Switch, so any slug here is a client slug.
  const [matchedSlug, params] = useRoute("/portal/:slug");
  const slug = matchedSlug ? params?.slug : undefined;

  const { data: branding } = trpc.clientPortal.publicBranding.useQuery(
    { slug: slug! },
    { enabled: !!slug, retry: false },
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.clientPortal.login.useMutation({
    onSuccess: (data) => {
      // Store the session for this tab only (see lib/portalSession).
      setPortalSession(data.token, data.user);
      setLocation("/portal/dashboard");
    },
    onError: (error) => {
      alert(`Login failed: ${error.message}`);
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    loginMutation.mutate({ email, password });
  };

  const primaryColor = branding?.primaryColor || undefined;
  const heading = branding?.portalName || branding?.clientName || "Client Portal";
  const subheading = branding?.welcomeMessage || "Sign in to view your content and reports";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={heading}
              className="mx-auto mb-4 h-16 w-auto object-contain"
            />
          ) : (
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
              style={primaryColor ? { backgroundColor: `${primaryColor}1a` } : undefined}
            >
              <LogIn className="h-8 w-8 text-primary" style={primaryColor ? { color: primaryColor } : undefined} />
            </div>
          )}
          <h1 className="text-3xl font-bold" style={primaryColor ? { color: primaryColor } : undefined}>
            {heading}
          </h1>
          <p className="text-muted-foreground mt-2">{subheading}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            style={primaryColor ? { backgroundColor: primaryColor } : undefined}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Don't have an account?</p>
          <p className="mt-1">Contact your account manager for an invitation.</p>
        </div>
      </Card>
    </div>
  );
}
