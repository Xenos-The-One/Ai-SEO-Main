import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CheckCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function PortalAcceptInvitation() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  const acceptMutation = trpc.clientPortal.acceptInvitation.useMutation({
    onSuccess: () => {
      setDone(true);
      toast.success("Password set! You can now sign in.");
      setTimeout(() => setLocation("/portal/login"), 1500);
    },
    onError: (error) => toast.error(error.message || "Failed to set password"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    acceptMutation.mutate({ token, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            {done ? <CheckCircle className="h-8 w-8 text-green-500" /> : <KeyRound className="h-8 w-8 text-primary" />}
          </div>
          <h1 className="text-3xl font-bold">Accept Invitation</h1>
          <p className="text-muted-foreground mt-2">
            Set a password to activate your portal access
          </p>
        </div>

        {!token ? (
          <div className="text-center text-sm text-muted-foreground">
            <p>This invitation link is missing its token.</p>
            <p className="mt-1">Please use the full link from your invitation email.</p>
          </div>
        ) : done ? (
          <div className="text-center text-sm text-muted-foreground">
            <p>Your account is ready. Redirecting to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={acceptMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={acceptMutation.isPending}
              />
            </div>
            <Button type="submit" className="w-full" disabled={acceptMutation.isPending}>
              {acceptMutation.isPending ? "Setting password…" : "Activate Account"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
