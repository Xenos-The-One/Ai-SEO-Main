import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScanSearch, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Audit = {
  id: number;
  status: "crawling" | "complete" | "failed";
  target: string;
  pagesCrawled: number;
  onpageScore: string | null;
  criticalCount: number;
  warningCount: number;
  checks: string | null;
};

// Prettify a DataForSEO check key like "duplicate_title_tag" → "Duplicate title tag".
function labelCheck(key: string): string {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function SiteAudit() {
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: clients } = trpc.clients.list.useQuery();
  const runMutation = trpc.siteAudit.run.useMutation();
  const checkStatusMutation = trpc.siteAudit.checkStatus.useMutation();
  const { data: pages } = trpc.siteAudit.pages.useQuery(
    { auditId: audit?.id ?? 0 },
    { enabled: audit?.status === "complete" }
  );

  // Poll while a crawl is running.
  useEffect(() => {
    if (audit?.status !== "crawling") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const updated = await checkStatusMutation.mutateAsync({ auditId: audit.id });
        setAudit(updated as Audit);
        if (updated.status === "complete") toast.success("Site audit complete");
        if (updated.status === "failed") toast.error("Site audit failed");
      } catch (error: any) {
        toast.error(error?.message || "Failed to check crawl status");
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audit?.status, audit?.id]);

  const handleRun = async () => {
    if (selectedClient === null) {
      toast.error("Select a client first");
      return;
    }
    try {
      const row = await runMutation.mutateAsync({ clientId: selectedClient });
      setAudit(row as Audit);
      toast.success("Crawl started — this can take a few minutes");
    } catch (error: any) {
      toast.error(error?.message || "Failed to start site audit");
    }
  };

  const checks: Record<string, number> = audit?.checks ? safeParse(audit.checks) : {};
  const activeChecks = Object.entries(checks)
    .filter(([, n]) => typeof n === "number" && n > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Site Audit</h1>
        <p className="text-muted-foreground mt-2">
          Crawl a client's whole site and surface technical SEO issues across every page
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
          <Button onClick={handleRun} disabled={runMutation.isPending || audit?.status === "crawling"}>
            {runMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting…
              </>
            ) : (
              <>
                <ScanSearch className="h-4 w-4 mr-2" /> Run Site Audit
              </>
            )}
          </Button>
        </div>
      </Card>

      {audit?.status === "crawling" && (
        <Card className="p-6 mt-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">Crawling {audit.target}…</p>
              <p className="text-sm text-muted-foreground">{audit.pagesCrawled} pages crawled so far</p>
            </div>
          </div>
          <Progress value={undefined} className="mt-4" />
        </Card>
      )}

      {audit?.status === "complete" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <ScoreCard label="On-Page Score" value={audit.onpageScore ? `${Math.round(Number(audit.onpageScore))}` : "—"} />
            <ScoreCard label="Pages Crawled" value={audit.pagesCrawled.toString()} />
            <ScoreCard label="Critical Issues" value={audit.criticalCount.toString()} tone="critical" />
            <ScoreCard label="Warnings" value={audit.warningCount.toString()} tone="warning" />
          </div>

          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Site-wide checks</h3>
            {activeChecks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues flagged. 🎉</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeChecks.map(([key, n]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{labelCheck(key)}</span>
                    <Badge variant="outline">{n}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {pages && pages.length > 0 && (
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Weakest pages</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4">URL</th>
                      <th className="py-2 px-4 text-right">Status</th>
                      <th className="py-2 px-4 text-right">Score</th>
                      <th className="py-2 pl-4 text-right">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium truncate max-w-[420px]">{p.url}</td>
                        <td className="py-2 px-4 text-right">{p.statusCode ?? "—"}</td>
                        <td className="py-2 px-4 text-right">
                          {p.onpageScore != null ? Math.round(Number(p.onpageScore)) : "—"}
                        </td>
                        <td className="py-2 pl-4 text-right">{countIssues(p.issues)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {audit?.status === "failed" && (
        <Card className="p-6 mt-6 border-red-500/40">
          <p className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" /> The crawl failed. Check the client's website URL and try again.
          </p>
        </Card>
      )}
    </div>
  );
}

function ScoreCard({ label, value, tone }: { label: string; value: string; tone?: "critical" | "warning" }) {
  const color = tone === "critical" ? "text-red-500" : tone === "warning" ? "text-amber-500" : "text-foreground";
  const Icon = tone === "critical" ? AlertCircle : tone === "warning" ? AlertTriangle : null;
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </Card>
  );
}

function safeParse(json: string): Record<string, number> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function countIssues(json: string | null): number {
  if (!json) return 0;
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}
