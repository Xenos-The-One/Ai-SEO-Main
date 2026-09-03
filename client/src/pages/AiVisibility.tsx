import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Sparkles, Trash2, Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AiVisibility() {
  const utils = trpc.useUtils();
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);

  // Create-brand form
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [competitorsRaw, setCompetitorsRaw] = useState("");
  const [newPrompt, setNewPrompt] = useState("");

  const providersQuery = trpc.aiVisibility.providers.useQuery();
  const brandsQuery = trpc.aiVisibility.listBrands.useQuery();
  const promptsQuery = trpc.aiVisibility.listPrompts.useQuery(
    { brandId: selectedBrand! }, { enabled: selectedBrand != null }
  );
  const latestQuery = trpc.aiVisibility.latestResults.useQuery(
    { brandId: selectedBrand! }, { enabled: selectedBrand != null }
  );
  const trendQuery = trpc.aiVisibility.trend.useQuery(
    { brandId: selectedBrand! }, { enabled: selectedBrand != null }
  );

  const createBrand = trpc.aiVisibility.createBrand.useMutation();
  const addPrompt = trpc.aiVisibility.addPrompt.useMutation();
  const deletePrompt = trpc.aiVisibility.deletePrompt.useMutation();
  const runScan = trpc.aiVisibility.runScan.useMutation();

  const handleCreateBrand = async () => {
    if (!name.trim()) return toast.error("Brand name required");
    const competitors = competitorsRaw.split(/[,\n]/).map((c) => c.trim()).filter(Boolean);
    try {
      const brand = await createBrand.mutateAsync({ name, domain: domain || undefined, competitors });
      await utils.aiVisibility.listBrands.invalidate();
      setSelectedBrand(brand.id);
      setName(""); setDomain(""); setCompetitorsRaw("");
      toast.success("Brand created");
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  const handleAddPrompt = async () => {
    if (!newPrompt.trim() || selectedBrand == null) return;
    try {
      await addPrompt.mutateAsync({ brandId: selectedBrand, prompt: newPrompt });
      setNewPrompt("");
      await utils.aiVisibility.listPrompts.invalidate({ brandId: selectedBrand });
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  const handleDeletePrompt = async (id: number) => {
    await deletePrompt.mutateAsync({ id });
    if (selectedBrand != null) await utils.aiVisibility.listPrompts.invalidate({ brandId: selectedBrand });
  };

  const handleRunScan = async () => {
    if (selectedBrand == null) return;
    try {
      const res = await runScan.mutateAsync({ brandId: selectedBrand });
      toast.success(`Scan complete — ${res.score}% visibility across ${res.providers.length} engine(s)`);
      await Promise.all([
        utils.aiVisibility.latestResults.invalidate({ brandId: selectedBrand }),
        utils.aiVisibility.trend.invalidate({ brandId: selectedBrand }),
      ]);
    } catch (e: any) { toast.error(e?.message || "Scan failed"); }
  };

  const sentimentColor = (s: string | null) =>
    s === "positive" ? "text-green-500" : s === "negative" ? "text-red-500" : "text-muted-foreground";

  const results = latestQuery.data?.results ?? [];
  const score = results.length > 0 ? Math.round((results.filter((r: any) => r.mentioned).length / results.length) * 100) : null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">AI Visibility (GEO)</h1>
        <p className="text-muted-foreground mt-2">Track how your brand appears in AI answer engines</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-sm text-muted-foreground">Engines:</span>
          {providersQuery.data?.length ? providersQuery.data.map((p) => (
            <Badge key={p} variant="secondary" className="capitalize">{p}</Badge>
          )) : <span className="text-sm text-muted-foreground">none configured (set provider API keys)</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: brand + prompts */}
        <div className="space-y-6">
          <Card className="p-6 space-y-3">
            <Label>Brand</Label>
            <Select value={selectedBrand?.toString() ?? ""} onValueChange={(v) => setSelectedBrand(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger>
              <SelectContent>
                {brandsQuery.data?.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="pt-3 border-t space-y-2">
              <Label className="text-xs text-muted-foreground">Add a new brand</Label>
              <Input placeholder="Brand name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Domain (optional)" value={domain} onChange={(e) => setDomain(e.target.value)} />
              <Input placeholder="Competitors (comma-separated)" value={competitorsRaw} onChange={(e) => setCompetitorsRaw(e.target.value)} />
              <Button size="sm" onClick={handleCreateBrand} disabled={createBrand.isPending} className="w-full">
                {createBrand.isPending ? "Creating…" : "Create Brand"}
              </Button>
            </div>
          </Card>

          {selectedBrand != null && (
            <Card className="p-6 space-y-3">
              <Label>Tracked Prompts</Label>
              <div className="flex gap-2">
                <Input placeholder='e.g. "best SEO tools"' value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPrompt()} />
                <Button size="sm" onClick={handleAddPrompt} disabled={addPrompt.isPending}>Add</Button>
              </div>
              <div className="space-y-1">
                {promptsQuery.data?.length ? promptsQuery.data.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                    <span className="truncate mr-2">{p.prompt}</span>
                    <button onClick={() => handleDeletePrompt(p.id)} className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No prompts yet.</p>}
              </div>
              <Button onClick={handleRunScan} disabled={runScan.isPending || !promptsQuery.data?.length} className="w-full">
                {runScan.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scanning…</> : <><Play className="h-4 w-4 mr-2" />Run Scan</>}
              </Button>
            </Card>
          )}
        </div>

        {/* Right: results */}
        <div className="lg:col-span-2 space-y-6">
          {selectedBrand == null ? (
            <Card className="p-12 text-center text-muted-foreground">
              <Bot className="h-10 w-10 mx-auto mb-3 opacity-40" />
              Select or create a brand, add prompts, and run a scan.
            </Card>
          ) : (
            <>
              {score != null && (
                <Card className="p-6 flex items-center gap-6">
                  <div className="text-center">
                    <Sparkles className="h-6 w-6 mx-auto text-primary" />
                    <div className="text-4xl font-bold">{score}%</div>
                    <div className="text-xs text-muted-foreground">visibility</div>
                  </div>
                  <div className="flex-1 text-sm text-muted-foreground">
                    Brand mentioned in {results.filter((r: any) => r.mentioned).length} of {results.length} answer(s) in the latest scan.
                  </div>
                </Card>
              )}

              {results.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Latest Results</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b">
                          <th className="py-2 pr-4">Prompt</th>
                          <th className="py-2 px-4">Engine</th>
                          <th className="py-2 px-4">Mentioned</th>
                          <th className="py-2 px-4">Pos.</th>
                          <th className="py-2 px-4">Sentiment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r: any) => (
                          <tr key={r.id} className="border-b last:border-0 align-top">
                            <td className="py-2 pr-4 max-w-[240px] truncate" title={r.prompt}>{r.prompt}</td>
                            <td className="py-2 px-4 capitalize">{r.provider}</td>
                            <td className="py-2 px-4">
                              {r.mentioned ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                            </td>
                            <td className="py-2 px-4">{r.position ?? "—"}</td>
                            <td className={`py-2 px-4 capitalize ${sentimentColor(r.sentiment)}`}>{r.sentiment ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {(trendQuery.data?.length ?? 0) > 1 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Visibility Trend</h3>
                  <div className="space-y-2">
                    {trendQuery.data!.map((t) => (
                      <div key={t.scanId} className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground w-40">{new Date(t.date).toLocaleString()}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${t.score}%` }} />
                        </div>
                        <span className="font-medium w-12 text-right">{t.score}%</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
