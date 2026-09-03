import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Swords, Search, TrendingUp, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Competitors() {
  const [domain, setDomain] = useState("");
  const [competitors, setCompetitors] = useState<any[]>([]);

  const [yourDomain, setYourDomain] = useState("");
  const [competitorDomain, setCompetitorDomain] = useState("");
  const [shared, setShared] = useState<any[]>([]);

  const findMutation = trpc.competitors.find.useMutation();
  const compareMutation = trpc.competitors.compare.useMutation();

  const handleFind = async () => {
    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }
    try {
      const results = await findMutation.mutateAsync({ domain, limit: 20 });
      setCompetitors(results);
      toast.success(`Found ${results.length} competitors`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to find competitors");
    }
  };

  const handleCompare = async () => {
    if (!yourDomain.trim() || !competitorDomain.trim()) {
      toast.error("Please enter both domains");
      return;
    }
    try {
      const results = await compareMutation.mutateAsync({ yourDomain, competitorDomain, limit: 50 });
      setShared(results);
      toast.success(`Found ${results.length} shared keywords`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to compare domains");
    }
  };

  const useAsCompetitor = (d: string) => {
    setCompetitorDomain(d);
    if (!yourDomain) setYourDomain(domain);
    toast.success(`Set "${d}" as the comparison competitor`);
  };

  const rankLabel = (rank: number | null) => (rank == null ? "—" : `#${rank}`);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Competitor Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Discover who you compete with in search and see which keywords they win
        </p>
      </div>

      <Tabs defaultValue="find" className="space-y-6">
        <TabsList>
          <TabsTrigger value="find">
            <Swords className="h-4 w-4 mr-2" />
            Find Competitors
          </TabsTrigger>
          <TabsTrigger value="compare">
            <Search className="h-4 w-4 mr-2" />
            Compare Domains
          </TabsTrigger>
        </TabsList>

        {/* Find Competitors */}
        <TabsContent value="find" className="space-y-6">
          <Card className="p-6">
            <Label htmlFor="domain">Your Domain</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="domain"
                placeholder="e.g., yoursite.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFind()}
              />
              <Button onClick={handleFind} disabled={findMutation.isPending}>
                {findMutation.isPending ? "Searching..." : "Find Competitors"}
              </Button>
            </div>
          </Card>

          {competitors.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Organic Competitors</h3>
              <div className="space-y-3">
                {competitors.map((c, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{c.domain}</span>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{c.commonKeywords.toLocaleString()} shared keywords</span>
                        <span>{c.organicKeywords.toLocaleString()} organic keywords</span>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{c.organicTraffic.toLocaleString()} est. traffic</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => useAsCompetitor(c.domain)}>
                      Compare
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Compare Domains */}
        <TabsContent value="compare" className="space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="your-domain">Your Domain</Label>
                <Input
                  id="your-domain"
                  placeholder="yoursite.com"
                  value={yourDomain}
                  onChange={(e) => setYourDomain(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="competitor-domain">Competitor Domain</Label>
                <Input
                  id="competitor-domain"
                  placeholder="competitor.com"
                  value={competitorDomain}
                  onChange={(e) => setCompetitorDomain(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <Button onClick={handleCompare} disabled={compareMutation.isPending} className="mt-4">
              {compareMutation.isPending ? "Comparing..." : "Compare"}
            </Button>
          </Card>

          {shared.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Shared Keywords</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4">Keyword</th>
                      <th className="py-2 px-4 text-right">Volume</th>
                      <th className="py-2 px-4 text-right">Difficulty</th>
                      <th className="py-2 px-4 text-right">You</th>
                      <th className="py-2 px-4 text-right">Competitor</th>
                      <th className="py-2 pl-4">Edge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shared.map((k, index) => {
                      const you = k.yourRank as number | null;
                      const comp = k.competitorRank as number | null;
                      const compWins = comp != null && (you == null || comp < you);
                      return (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{k.keyword}</td>
                          <td className="py-2 px-4 text-right">{k.searchVolume.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right">{k.difficulty}/100</td>
                          <td className="py-2 px-4 text-right">{rankLabel(you)}</td>
                          <td className="py-2 px-4 text-right">{rankLabel(comp)}</td>
                          <td className="py-2 pl-4">
                            <Badge
                              variant="outline"
                              className={compWins ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}
                            >
                              {compWins ? "Opportunity" : "You lead"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                "Opportunity" = the competitor ranks higher than you for that keyword.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
