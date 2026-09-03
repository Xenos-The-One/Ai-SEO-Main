import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, Loader2, RefreshCw, Globe, Tag, Network, ShieldAlert, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Backlinks() {
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  const { data: clients } = trpc.clients.list.useQuery();
  const utils = trpc.useUtils();
  const latestQuery = trpc.backlinks.latest.useQuery(
    { clientId: selectedClient ?? 0 },
    { enabled: selectedClient !== null }
  );
  const profileMutation = trpc.backlinks.profile.useMutation();
  const linkGapMutation = trpc.backlinks.linkGap.useMutation();
  const toxicMutation = trpc.backlinks.toxicLinks.useMutation();

  const [competitorsText, setCompetitorsText] = useState("");
  const [gapRows, setGapRows] = useState<any[]>([]);
  const [threshold, setThreshold] = useState(50);
  const [toxic, setToxic] = useState<{ links: any[]; toxicCount: number; avgSpamScore: number; disavowText: string } | null>(null);

  const handleLinkGap = async () => {
    if (selectedClient === null) return;
    const competitors = competitorsText.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5);
    if (competitors.length === 0) {
      toast.error("Enter at least one competitor domain");
      return;
    }
    try {
      const rows = await linkGapMutation.mutateAsync({ clientId: selectedClient, competitors });
      setGapRows(rows);
      toast.success(`${rows.length} link-gap opportunities`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to compute link gap");
    }
  };

  const handleToxic = async () => {
    if (selectedClient === null) return;
    try {
      const res = await toxicMutation.mutateAsync({ clientId: selectedClient, threshold });
      setToxic(res);
      toast.success(`${res.toxicCount} toxic links at spam ≥ ${threshold}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to analyze toxic links");
    }
  };

  const copyDisavow = async () => {
    if (!toxic?.disavowText) return;
    try {
      await navigator.clipboard.writeText(toxic.disavowText);
      toast.success("Disavow file copied to clipboard");
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  };

  const handleRefresh = async () => {
    if (selectedClient === null) {
      toast.error("Select a client first");
      return;
    }
    try {
      const res = await profileMutation.mutateAsync({ clientId: selectedClient });
      utils.backlinks.latest.invalidate({ clientId: selectedClient });
      utils.backlinks.history.invalidate({ clientId: selectedClient });
      toast.success(`${res.summary.backlinks.toLocaleString()} backlinks from ${res.summary.referringDomains.toLocaleString()} domains`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch backlink profile");
    }
  };

  const data = latestQuery.data;
  const snap = data?.snapshot;
  const refDomains: any[] = data?.referringDomains ?? [];
  const anchors: any[] = data?.anchors ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Backlinks</h1>
        <p className="text-muted-foreground mt-2">
          Analyze a client's backlink profile, referring domains, and anchor-text distribution
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Client</label>
            <Select
              value={selectedClient?.toString() || ""}
              onValueChange={(v) => setSelectedClient(parseInt(v))}
            >
              <SelectTrigger className="w-[240px] mt-2">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedClient !== null && (
            <Button onClick={handleRefresh} disabled={profileMutation.isPending}>
              {profileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" /> {snap ? "Refresh profile" : "Fetch profile"}
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {selectedClient !== null && (
        <Tabs defaultValue="overview" className="space-y-6 mt-6">
          <TabsList>
            <TabsTrigger value="overview">
              <Link2 className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="domains">
              <Globe className="h-4 w-4 mr-2" /> Referring Domains
            </TabsTrigger>
            <TabsTrigger value="anchors">
              <Tag className="h-4 w-4 mr-2" /> Anchors
            </TabsTrigger>
            <TabsTrigger value="gap">
              <Network className="h-4 w-4 mr-2" /> Link Gap
            </TabsTrigger>
            <TabsTrigger value="toxic">
              <ShieldAlert className="h-4 w-4 mr-2" /> Toxic Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {snap ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Metric label="Backlinks" value={snap.backlinks.toLocaleString()} />
                  <Metric label="Referring Domains" value={snap.referringDomains.toLocaleString()} />
                  <Metric label="Domain Rank" value={snap.rank.toString()} sub="/ 1000" />
                  <Metric label="Broken Backlinks" value={snap.brokenBacklinks.toLocaleString()} />
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Last updated {new Date(snap.createdAt).toLocaleString()} · {snap.target}
                </p>
              </>
            ) : (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">
                  No backlink data yet. Click "Fetch profile" above to pull it from DataForSEO.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="domains">
            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4">Domain</th>
                      <th className="py-2 px-4 text-right">Backlinks</th>
                      <th className="py-2 px-4 text-right">Rank</th>
                      <th className="py-2 px-4 text-right">Spam</th>
                      <th className="py-2 pl-4">First seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refDomains.map((r, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{r.domain}</td>
                        <td className="py-2 px-4 text-right">{Number(r.backlinks).toLocaleString()}</td>
                        <td className="py-2 px-4 text-right">{r.rank}</td>
                        <td className="py-2 px-4 text-right">
                          <SpamBadge score={r.spamScore} />
                        </td>
                        <td className="py-2 pl-4 text-muted-foreground">
                          {r.firstSeen ? new Date(r.firstSeen).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="anchors">
            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4">Anchor text</th>
                      <th className="py-2 px-4 text-right">Backlinks</th>
                      <th className="py-2 pl-4 text-right">Referring domains</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anchors.map((a, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium truncate max-w-[420px]">{a.anchor}</td>
                        <td className="py-2 px-4 text-right">{Number(a.backlinks).toLocaleString()}</td>
                        <td className="py-2 pl-4 text-right">{Number(a.referringDomains).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="gap">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-3">
                Enter up to 5 competitor domains (comma-separated). We'll find referring domains that link to
                them but <strong>not</strong> to this client — your outreach targets.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="competitor1.com, competitor2.com"
                  value={competitorsText}
                  onChange={(e) => setCompetitorsText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLinkGap()}
                />
                <Button onClick={handleLinkGap} disabled={linkGapMutation.isPending}>
                  {linkGapMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find gaps"}
                </Button>
              </div>

              {gapRows.length > 0 && (
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="py-2 pr-4">Referring domain</th>
                        <th className="py-2 px-4 text-right">Rank</th>
                        <th className="py-2 px-4 text-right">Competitors linked</th>
                        <th className="py-2 pl-4 text-right">Backlinks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gapRows.map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{r.referringDomain}</td>
                          <td className="py-2 px-4 text-right">{r.rank}</td>
                          <td className="py-2 px-4 text-right">{r.competitorsLinked}</td>
                          <td className="py-2 pl-4 text-right">{Number(r.backlinks).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="toxic">
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-6">
                <div className="w-64">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Spam-score threshold</span>
                    <span className="font-medium">{threshold}</span>
                  </div>
                  <Slider value={[threshold]} min={0} max={100} step={5} onValueChange={(v) => setThreshold(v[0])} />
                </div>
                <Button onClick={handleToxic} disabled={toxicMutation.isPending}>
                  {toxicMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…
                    </>
                  ) : (
                    "Analyze toxic links"
                  )}
                </Button>
                {toxic && (
                  <Button variant="outline" onClick={copyDisavow} disabled={!toxic.disavowText}>
                    <Copy className="h-4 w-4 mr-2" /> Copy disavow file
                  </Button>
                )}
              </div>

              {toxic && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                    <Metric label="Toxic links" value={toxic.toxicCount.toLocaleString()} />
                    <Metric label="Avg spam score" value={toxic.avgSpamScore.toString()} sub="/ 100" />
                    <Metric label="Threshold" value={`≥ ${threshold}`} />
                  </div>
                  <div className="overflow-x-auto mt-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b">
                          <th className="py-2 pr-4">Source domain</th>
                          <th className="py-2 px-4">Anchor</th>
                          <th className="py-2 px-4 text-right">Spam</th>
                          <th className="py-2 pl-4">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {toxic.links.map((l, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium truncate max-w-[280px]">{l.sourceDomain}</td>
                            <td className="py-2 px-4 truncate max-w-[240px] text-muted-foreground">{l.anchor || "—"}</td>
                            <td className="py-2 px-4 text-right">
                              <SpamBadge score={l.spamScore} />
                            </td>
                            <td className="py-2 pl-4 text-muted-foreground">{l.dofollow ? "dofollow" : "nofollow"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-1">
        {value}
        {sub && <span className="text-base text-muted-foreground font-normal ml-1">{sub}</span>}
      </p>
    </Card>
  );
}

function SpamBadge({ score }: { score: number }) {
  const tone = score >= 60 ? "border-red-500 text-red-500" : score >= 30 ? "border-amber-500 text-amber-500" : "border-green-500 text-green-500";
  return (
    <Badge variant="outline" className={tone}>
      {score}
    </Badge>
  );
}
