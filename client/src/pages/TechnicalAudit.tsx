import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gauge, AlertTriangle, AlertCircle, Info, Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Issue = { severity: "critical" | "warning" | "info"; category: string; message: string; recommendation: string };

export default function TechnicalAudit() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const auditMutation = trpc.seoAudit.auditUrl.useMutation();

  const handleAudit = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    try {
      const res = await auditMutation.mutateAsync({ url });
      setResult(res);
      toast.success(`Audit complete — score ${res.score}/100`);
    } catch (error: any) {
      toast.error(error?.message || "Audit failed");
    }
  };

  const scoreColor = (s: number) => (s >= 80 ? "text-green-500" : s >= 50 ? "text-yellow-500" : "text-red-500");
  const severityRank = { critical: 0, warning: 1, info: 2 } as const;

  const issues: Issue[] = result?.issues
    ? [...result.issues].sort((a: Issue, b: Issue) => severityRank[a.severity] - severityRank[b.severity])
    : [];

  const sevIcon = (s: Issue["severity"]) =>
    s === "critical" ? <AlertCircle className="h-4 w-4 text-red-500" /> :
    s === "warning" ? <AlertTriangle className="h-4 w-4 text-yellow-500" /> :
    <Info className="h-4 w-4 text-blue-500" />;

  const counts = {
    critical: issues.filter((i) => i.severity === "critical").length,
    warning: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length,
  };

  const m = result?.metrics;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Technical SEO Audit</h1>
        <p className="text-muted-foreground mt-2">
          Crawl a live page for real technical and on-page issues
        </p>
      </div>

      <Card className="p-6 mb-6">
        <Label htmlFor="url">Page URL</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="url"
            placeholder="https://example.com/page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAudit()}
          />
          <Button onClick={handleAudit} disabled={auditMutation.isPending}>
            {auditMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Auditing...</> : "Run Audit"}
          </Button>
        </div>
      </Card>

      {result && (
        <div className="space-y-6">
          {/* Score + summary */}
          <Card className="p-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <Gauge className={`h-8 w-8 mx-auto ${scoreColor(result.score)}`} />
                <div className={`text-4xl font-bold ${scoreColor(result.score)}`}>{result.score}</div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
              <div className="flex-1">
                <a href={result.finalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                  {result.finalUrl} <ExternalLink className="h-3 w-3" />
                </a>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="border-red-500 text-red-500">{counts.critical} critical</Badge>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">{counts.warning} warnings</Badge>
                  <Badge variant="outline" className="border-blue-500 text-blue-500">{counts.info} info</Badge>
                </div>
                <div className="mt-3">
                  <Progress value={result.score} className="h-2" />
                </div>
              </div>
            </div>
          </Card>

          {/* Metrics */}
          {m && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Page Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <Metric label="HTTP status" value={m.statusCode} />
                <Metric label="Response time" value={`${m.responseTimeMs} ms`} />
                <Metric label="Word count" value={m.wordCount.toLocaleString()} />
                <Metric label="Indexable" value={m.indexable ? "Yes" : "No"} />
                <Metric label="Title length" value={m.title ? `${m.titleLength} chars` : "missing"} />
                <Metric label="Meta description" value={m.metaDescription ? `${m.metaDescriptionLength} chars` : "missing"} />
                <Metric label="H1 / H2" value={`${m.h1Count} / ${m.h2Count}`} />
                <Metric label="Images (no alt)" value={`${m.imageCount} (${m.imagesMissingAlt})`} />
                <Metric label="Internal links" value={m.internalLinks} />
                <Metric label="External links" value={m.externalLinks} />
                <Metric label="Canonical" value={m.canonical ? "Yes" : "No"} />
                <Metric label="Structured data" value={m.hasStructuredData ? "Yes" : "No"} />
              </div>
              {result.pageSpeed?.performanceScore != null && (
                <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <Metric label="PageSpeed" value={`${result.pageSpeed.performanceScore}/100`} />
                  {result.pageSpeed.lcpMs != null && <Metric label="LCP" value={`${Math.round(result.pageSpeed.lcpMs)} ms`} />}
                  {result.pageSpeed.cls != null && <Metric label="CLS" value={result.pageSpeed.cls.toFixed(3)} />}
                  {result.pageSpeed.tbtMs != null && <Metric label="TBT" value={`${Math.round(result.pageSpeed.tbtMs)} ms`} />}
                </div>
              )}
            </Card>
          )}

          {/* On-page details (actual values) */}
          {m && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">On-Page Details</h3>
              <div className="space-y-3 text-sm">
                <Detail label="Title" value={m.title || "— missing —"} />
                <Detail label="Meta description" value={m.metaDescription || "— missing —"} />
                <Detail label="H1" value={m.h1Text || "— missing —"} />
                <Detail label="Canonical" value={m.canonical || "— none —"} />
                <Detail label="Lang" value={m.lang || "— none —"} />
                <Detail label="Robots directive" value={m.robotsDirective || "— none (defaults to index,follow) —"} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
                  <Flag label="Open Graph" ok={!!(m.ogTitle && m.ogImage)} />
                  <Flag label="Twitter Card" ok={m.hasTwitterCard} />
                  <Flag label="robots.txt" ok={m.robotsTxt} />
                  <Flag label="sitemap.xml" ok={m.sitemap} />
                  <Flag label="Viewport" ok={m.hasViewport} />
                  <Flag label="Structured data" ok={m.hasStructuredData} />
                  <Detail label="hreflang tags" value={String(m.hreflangCount)} inline />
                </div>
              </div>
            </Card>
          )}

          {/* Issues */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Issues ({issues.length})</h3>
            {issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues found — nice work.</p>
            ) : (
              <div className="space-y-3">
                {issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    {sevIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{issue.message}</span>
                        <Badge variant="secondary" className="text-xs">{issue.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{issue.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Broken links */}
          {result.brokenLinks?.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Broken Links ({result.brokenLinks.length})</h3>
              <div className="space-y-2">
                {result.brokenLinks.map((bl: { url: string; status: number | null }, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                    <span className="truncate mr-4">{bl.url}</span>
                    <Badge variant="outline" className="border-red-500 text-red-500">
                      {bl.status == null ? "unreachable" : `HTTP ${bl.status}`}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Detail({ label, value, inline }: { label: string; value: string; inline?: boolean }) {
  if (inline) {
    return (
      <div>
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3">
      <div className="text-muted-foreground w-40 shrink-0">{label}</div>
      <div className="font-medium break-words">{value}</div>
    </div>
  );
}

function Flag({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className={`font-medium ${ok ? "text-green-500" : "text-red-500"}`}>{ok ? "Present" : "Missing"}</div>
    </div>
  );
}
