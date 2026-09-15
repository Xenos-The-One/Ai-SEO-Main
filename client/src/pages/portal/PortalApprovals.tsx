import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getPortalToken, getPortalUserRaw, clearPortalSession } from "@/lib/portalSession";
import { CheckCircle, Clock, FileText, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

export default function PortalApprovals() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = getPortalToken();
    const userData = getPortalUserRaw();
    if (!token || !userData) {
      setLocation("/portal/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [setLocation]);

  const { data: contentList, isLoading, refetch } = trpc.clientPortal.myContent.useQuery(
    undefined,
    { enabled: !!user }
  );
  const approveMutation = trpc.clientPortal.approve.useMutation();

  const handleApprove = async (contentId: number) => {
    try {
      await approveMutation.mutateAsync({ contentId });
      toast.success("Content approved");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve content");
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const pending = (contentList || []).filter((item: any) => item.status !== "approved");
  const canApprove = user.role === "client_admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Approvals</h1>
              <p className="text-sm text-muted-foreground">Review and approve content awaiting your feedback</p>
            </div>
            <Link href="/portal/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Loading…</div>
        ) : pending.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-70" />
            <h3 className="text-lg font-semibold mb-2">All caught up</h3>
            <p className="text-muted-foreground">There's no content awaiting your approval right now.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pending.map((item: any) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <Badge className="bg-yellow-500/10 text-yellow-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.topic}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Created {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/portal/content/${item.id}`}>
                        <Button variant="outline" size="sm">Review</Button>
                      </Link>
                      {canApprove && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(item.id)}
                          disabled={approveMutation.isPending}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
