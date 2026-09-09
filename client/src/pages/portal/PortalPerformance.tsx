import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Bot,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  MapPin,
  Briefcase,
  CalendarDays,
  Trophy,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Stable colors per engine so the line chart, bars and cards agree.
const ENGINE_COLORS: Record<string, string> = {
  openai: "#10b981",
  gemini: "#3b82f6",
  claude: "#f59e0b",
  perplexity: "#8b5cf6",
};
const colorFor = (provider: string) => ENGINE_COLORS[provider] || "#6b7280";

export default function PortalPerformance() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("client_portal_token");
    const userData = localStorage.getItem("client_portal_user");
    if (!token || !userData) {
      setLocation("/portal/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [setLocation]);

  const { data, isLoading } = trpc.clientPortal.performance.useQuery(undefined, { enabled: !!user });

  if (!user || isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse">Loading…</div>;
  }

  const perf = data!;
  const engines = perf.engines || [];
  const rankLabel = (n: number | null) => (n == null ? "—" : `#${n}`);
  const onboarded = perf.profile.onboardedAt
    ? new Date(perf.profile.onboardedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header bar */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Performance Dashboard</h1>
            <p className="text-sm text-muted-foreground">AI visibility &amp; search rankings</p>
          </div>
          <Link href="/portal/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Business profile + visibility score */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-foreground text-background">YOUR BUSINESS PROFILE</Badge>
                  {perf.bestRank === 1 && (
                    <Badge className="bg-amber-500/15 text-amber-600">
                      <Trophy className="h-3 w-3 mr-1" /> #1 Ranked
                    </Badge>
                  )}
                </div>
                <h2 className="text-3xl font-bold">{perf.profile.name || "—"}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {perf.profile.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {perf.profile.location}</span>
                  )}
                  {perf.profile.industry && (
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {perf.profile.industry}</span>
                  )}
                  <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Onboarded {onboarded}</span>
                  <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {perf.profile.monthsActive} months in engine</span>
                </div>
              </div>
              <div className="shrink-0 rounded-xl border p-5 text-center min-w-[180px]">
                <p className="text-xs text-muted-foreground">Visibility Score</p>
                <p className="text-4xl font-bold text-emerald-600 mt-1">
                  {perf.visibilityScore ?? "—"}
                  {perf.visibilityScore != null && <span className="text-lg text-muted-foreground">/100</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Across all AI engines</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!perf.hasAiData && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center py-10 text-muted-foreground">
              <Bot className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-foreground">No AI visibility data yet</p>
              <p className="text-sm mt-1">
                Set up AI Visibility tracking for this client's domain in the agency dashboard, then run a scan.
                Results will appear here automatically.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Best AI Rank" value={rankLabel(perf.bestRank)} icon={<Bot className="h-5 w-5" />} />
          <StatCard label="Top Engine" value={perf.topEngine || "—"} icon={<Sparkles className="h-5 w-5" />} />
          <StatCard label="Months Active" value={String(perf.profile.monthsActive)} icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard
            label="Citation Status"
            value={perf.citationStatus === "verified" ? "Verified" : "Pending"}
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        </div>

        {/* Charts */}
        {perf.hasAiData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Rank Progression</CardTitle>
                <p className="text-xs text-muted-foreground">Position over time (lower = better, #1 is top)</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={perf.rankProgression as any[]}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis reversed domain={[1, "dataMax"]} allowDecimals={false} fontSize={12} tickFormatter={(v) => `#${v}`} />
                    <Tooltip formatter={(v: any) => (v == null ? "—" : `#${v}`)} />
                    <Legend />
                    {engines.map((e) => (
                      <Line
                        key={e.provider}
                        type="monotone"
                        dataKey={e.provider}
                        name={e.label}
                        stroke={colorFor(e.provider)}
                        strokeWidth={2}
                        connectNulls
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Start vs Current</CardTitle>
                <p className="text-xs text-muted-foreground">Rank change per AI engine</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={perf.startVsCurrent as any[]}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis reversed domain={[1, "dataMax"]} allowDecimals={false} fontSize={12} tickFormatter={(v) => `#${v}`} />
                    <Tooltip formatter={(v: any) => (v == null ? "—" : `#${v}`)} />
                    <Legend />
                    <Bar dataKey="start" name="Start" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="current" name="Current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Per-engine cards */}
        {engines.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {engines.map((e) => (
              <Card key={e.provider}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: colorFor(e.provider) }} />
                      <span className="font-medium">{e.label}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{e.status}</Badge>
                  </div>
                  <p className="text-3xl font-bold">{rankLabel(e.currentRank)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Started at {rankLabel(e.startRank)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Keyword rankings (from rank tracking) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" /> Your Keyword Rankings
            </CardTitle>
            <p className="text-xs text-muted-foreground">Tracked search positions for your domain</p>
          </CardHeader>
          <CardContent>
            {!perf.hasKeywordData ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tracked keywords yet</p>
                <p className="text-sm mt-1">Add keywords in Rank Tracking to see positions here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4 font-medium">Keyword</th>
                      <th className="py-2 pr-4 font-medium">Location</th>
                      <th className="py-2 pr-4 font-medium">Position</th>
                      <th className="py-2 pr-4 font-medium">Prev</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perf.keywords.map((k, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{k.keyword}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{k.location}</td>
                        <td className="py-3 pr-4">
                          <Badge className="bg-emerald-500/10 text-emerald-600">{rankLabel(k.position)}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{rankLabel(k.prev)}</td>
                        <td className="py-3 pr-4">
                          <StatusPill status={k.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verified AI citations */}
        {perf.citations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verified AI Citations</CardTitle>
              <p className="text-xs text-muted-foreground">Prompts run against AI engines where your business is cited</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {perf.citations.map((c, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{c.label}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">
                        {c.position ? `Cited at #${c.position}` : "Cited"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-2">"{c.prompt}"</p>
                    {c.excerpt && <p className="text-xs line-clamp-4">{c.excerpt}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Rising: "text-emerald-600",
    Falling: "text-red-500",
    Stable: "text-muted-foreground",
    New: "text-blue-500",
  };
  return <span className={`text-xs font-medium ${map[status] || "text-muted-foreground"}`}>{status}</span>;
}
