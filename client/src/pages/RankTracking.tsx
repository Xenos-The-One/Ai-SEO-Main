import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Loader2, ArrowUp, ArrowDown, Minus, Trash2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function RankTracking() {
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");

  const { data: clients } = trpc.clients.list.useQuery();
  const utils = trpc.useUtils();
  const listQuery = trpc.rankTracking.listKeywords.useQuery(
    { clientId: selectedClient ?? 0 },
    { enabled: selectedClient !== null }
  );

  const addMutation = trpc.rankTracking.addKeyword.useMutation();
  const removeMutation = trpc.rankTracking.removeKeyword.useMutation();
  const runCheckMutation = trpc.rankTracking.runCheck.useMutation();

  const refetch = () => {
    if (selectedClient !== null) utils.rankTracking.listKeywords.invalidate({ clientId: selectedClient });
  };

  const handleAdd = async () => {
    if (selectedClient === null) {
      toast.error("Select a client first");
      return;
    }
    if (!keyword.trim()) {
      toast.error("Enter a keyword");
      return;
    }
    try {
      await addMutation.mutateAsync({ clientId: selectedClient, keyword: keyword.trim() });
      setKeyword("");
      refetch();
      toast.success("Keyword added");
    } catch (error: any) {
      toast.error(error?.message || "Failed to add keyword");
    }
  };

  const handleRemove = async (keywordId: number) => {
    try {
      await removeMutation.mutateAsync({ keywordId });
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove keyword");
    }
  };

  const handleRunCheck = async () => {
    if (selectedClient === null) return;
    try {
      const res = await runCheckMutation.mutateAsync({ clientId: selectedClient });
      refetch();
      toast.success(`Checked ${res.checked} of ${res.total} keywords`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to run rank check");
    }
  };

  const rows = listQuery.data ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Rank Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Track Google positions for a client's keywords. Checked on demand and automatically every week.
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
            <Button variant="outline" onClick={handleRunCheck} disabled={runCheckMutation.isPending}>
              {runCheckMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" /> Run check now
                </>
              )}
            </Button>
          )}
        </div>

        {selectedClient !== null && (
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Add a keyword to track, e.g. best running shoes"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={addMutation.isPending}>
              Add
            </Button>
          </div>
        )}
      </Card>

      {selectedClient !== null && (
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LineChart className="h-5 w-5" /> Tracked keywords
          </h3>
          {listQuery.isLoading ? (
            <div className="h-24 animate-pulse bg-muted rounded" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keywords yet. Add one above, then run a check.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4">Keyword</th>
                    <th className="py-2 px-4 text-right">Position</th>
                    <th className="py-2 px-4 text-right">Change</th>
                    <th className="py-2 px-4">Location</th>
                    <th className="py-2 px-4">Last checked</th>
                    <th className="py-2 pl-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((k) => (
                    <tr key={k.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{k.keyword}</td>
                      <td className="py-2 px-4 text-right">
                        {k.currentPosition != null ? `#${k.currentPosition}` : <span className="text-muted-foreground">Not ranked</span>}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <RankDelta current={k.currentPosition} previous={k.previousPosition} />
                      </td>
                      <td className="py-2 px-4 text-muted-foreground">{k.locationName}</td>
                      <td className="py-2 px-4 text-muted-foreground">
                        {k.lastCheckedAt ? new Date(k.lastCheckedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 pl-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(k.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// Lower position number = better. Improvement (previous > current) shows green up.
function RankDelta({ current, previous }: { current: number | null; previous: number | null }) {
  if (current == null || previous == null) {
    return <Minus className="h-4 w-4 inline text-muted-foreground" />;
  }
  const delta = previous - current; // positive = moved up
  if (delta === 0) return <Minus className="h-4 w-4 inline text-muted-foreground" />;
  if (delta > 0) {
    return (
      <Badge variant="outline" className="border-green-500 text-green-500">
        <ArrowUp className="h-3 w-3 mr-1" />
        {delta}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-red-500 text-red-500">
      <ArrowDown className="h-3 w-3 mr-1" />
      {Math.abs(delta)}
    </Badge>
  );
}
