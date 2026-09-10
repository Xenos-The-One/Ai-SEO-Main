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
  FileText,
  Eye,
  Check,
  Minus,
  ClipboardList,
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
  const { data: contentPerf } = trpc.clientPortal.contentAnalytics.useQuery(undefined, { enabled: !!user });
  const { data: plan } = trpc.clientPortal.servicePlan.useQuery(undefined, { enabled: !!user });

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

        {/* Plan & deliverables */}
        {plan?.hasPlan && <ServicePlan plan={plan} />}

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

        {/* Content Performance Analytics */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Content Performance Analytics</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">How your blogs, newsletters &amp; social posts are performing</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Content Pieces" value={String(contentPerf?.totalPieces ?? 0)} icon={<FileText className="h-5 w-5" />} />
            <StatCard label="Total Views" value={(contentPerf?.totalViews ?? 0).toLocaleString()} icon={<Eye className="h-5 w-5" />} />
            <StatCard label="Avg Engagement" value={`${contentPerf?.avgEngagement ?? 0}%`} icon={<TrendingUp className="h-5 w-5" />} />
            <StatCard label="AI Citations Earned" value={String(contentPerf?.aiCitationsEarned ?? 0)} icon={<Sparkles className="h-5 w-5" />} />
          </div>

          {!contentPerf?.hasData ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center py-10 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium text-foreground">No content performance data yet</p>
                <p className="text-sm mt-1">
                  Views and engagement appear here once analytics are recorded for this client's content
                  (via the Google Analytics connection or tracked publishing).
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance by Type</CardTitle>
                    <p className="text-xs text-muted-foreground">Views per channel</p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={contentPerf.byType as any[]}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="type" fontSize={12} tickFormatter={(t) => String(t).charAt(0).toUpperCase() + String(t).slice(1)} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="views" name="Views" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Performing Content</CardTitle>
                    <p className="text-xs text-muted-foreground">Your highest-viewed pieces</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contentPerf.library.slice(0, 5).map((c, i) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-sm font-medium">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{c.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{c.type}</p>
                        </div>
                        <div className="text-right text-sm">
                          <span className="font-medium">{c.views.toLocaleString()}</span>
                          <span className="text-muted-foreground"> views</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Content Library</CardTitle>
                  <p className="text-xs text-muted-foreground">All content with live performance metrics</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b">
                          <th className="py-2 pr-4 font-medium">Title</th>
                          <th className="py-2 pr-4 font-medium">Type</th>
                          <th className="py-2 pr-4 font-medium">Published</th>
                          <th className="py-2 pr-4 font-medium">Views</th>
                          <th className="py-2 pr-4 font-medium">Engage</th>
                          <th className="py-2 pr-4 font-medium">Conv.</th>
                          <th className="py-2 pr-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contentPerf.library.map((c) => (
                          <tr key={c.id} className="border-b last:border-0">
                            <td className="py-3 pr-4 font-medium">{c.title}</td>
                            <td className="py-3 pr-4 capitalize">{c.type}</td>
                            <td className="py-3 pr-4 text-muted-foreground">{new Date(c.publishedAt).toLocaleDateString()}</td>
                            <td className="py-3 pr-4">{c.views.toLocaleString()}</td>
                            <td className="py-3 pr-4">{c.engagement}%</td>
                            <td className="py-3 pr-4">{c.conversions}</td>
                            <td className="py-3 pr-4 capitalize">{c.status.replace("_", " ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

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

function ServicePlan({ plan }: { plan: any }) {
  const items: any[] = plan.items || [];
  const quotas = items.filter((i) => i.type === "quota");
  const others = items.filter((i) => i.type !== "quota");

  const levelClass = (level: string) => {
    const l = (level || "").toLowerCase();
    if (l === "full") return "bg-emerald-500/10 text-emerald-600";
    if (l === "basic") return "bg-amber-500/10 text-amber-600";
    if (l === "monthly") return "bg-indigo-500/10 text-indigo-600";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> Your Plan &amp; Deliverables
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          What your plan includes — monthly deliverables tracked for {plan.monthLabel}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly deliverables with live progress */}
        {quotas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotas.map((q) => {
              const delivered = q.delivered ?? 0;
              const target = q.target ?? 0;
              const pct = target > 0 ? Math.min(100, Math.round((delivered / target) * 100)) : 0;
              const onTrack = delivered >= target;
              return (
                <div key={q.key} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{q.label}</span>
                    <span className={`text-sm font-semibold ${onTrack ? "text-emerald-600" : "text-amber-600"}`}>
                      {delivered}/{target}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${onTrack ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    per {q.unit || "month"} · {onTrack ? "On track" : "In progress"}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* All other service lines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          {others.map((it) => {
            const included = it.type === "check" ? it.included !== false : true;
            return (
              <div key={it.key} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className={`text-sm ${included ? "" : "text-muted-foreground"}`}>{it.label}</span>
                {it.type === "level" ? (
                  <Badge className={`text-xs ${levelClass(it.level)}`}>{it.level}</Badge>
                ) : included ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check className="h-4 w-4" /> Included
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Minus className="h-4 w-4" /> Not in plan
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
