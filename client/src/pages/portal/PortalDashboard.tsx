import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, TrendingUp, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { clientReviewLabel } from "@/lib/portalReview";
import { getPortalToken, getPortalUserRaw, portalLoginPath } from "@/lib/portalSession";
import { PortalShell, PortalError } from "@/components/portal/PortalShell";

export default function PortalDashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = getPortalToken();
    const userData = getPortalUserRaw();

    if (!token || !userData) {
      setLocation(portalLoginPath());
      return;
    }

    setUser(JSON.parse(userData));
  }, [setLocation]);

  const { data: stats, isLoading, error, refetch } = trpc.clientPortal.stats.useQuery(undefined, { enabled: !!user });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const firstName = String(user.name || "").split(/[\s(]/)[0];

  return (
    <PortalShell title="Dashboard" subtitle={firstName ? `Welcome back, ${firstName}` : undefined}>
      {error ? (
        <PortalError onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Loading…</div>
      ) : stats && stats.totalContent === 0 ? (
        <Card className="p-10 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-60" />
          <h3 className="text-lg font-semibold mb-2">Your first content is on the way</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            When our team has a piece ready for you, it will appear here for your review. In the
            meantime, you can follow your search and AI visibility results.
          </p>
          <Link href="/portal/performance">
            <Button className="mt-6">
              View performance <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard label="Total Content" value={stats?.totalContent ?? 0} icon={<FileText className="h-10 w-10 text-blue-500" />} />
            <StatCard label="Awaiting Your Review" value={stats?.pendingApproval ?? 0} icon={<Clock className="h-10 w-10 text-orange-500" />} />
            <StatCard label="Approved" value={stats?.approved ?? 0} icon={<CheckCircle className="h-10 w-10 text-green-500" />} />
          </div>

          {(stats?.pendingApproval ?? 0) > 0 && (
            <Card className="p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-orange-500/40">
              <div>
                <h3 className="font-semibold">
                  {stats!.pendingApproval === 1 ? "1 piece is" : `${stats!.pendingApproval} pieces are`} waiting for your review
                </h3>
                <p className="text-sm text-muted-foreground">Approve them or tell us what to change.</p>
              </div>
              <Link href="/portal/approvals">
                <Button>
                  Review now <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Link href="/portal/performance" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4" /> Performance
              </Link>
            </div>
            <div className="divide-y">
              {stats?.recent.map((item) => (
                <Link key={item.id} href={`/portal/content/${item.id}`}>
                  <div className="flex items-center justify-between gap-3 py-3 cursor-pointer hover:opacity-80">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <span className="font-medium truncate">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-sm text-muted-foreground">
                      <span>{clientReviewLabel(item.clientReview)}</span>
                      <span className="hidden sm:inline">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </PortalShell>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        {icon}
      </div>
    </Card>
  );
}
