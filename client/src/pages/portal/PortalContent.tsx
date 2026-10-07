import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { PortalShell, PortalError } from "@/components/portal/PortalShell";
import { getPortalToken, getPortalUserRaw, portalLoginPath } from "@/lib/portalSession";
import { clientReviewBadgeClass, clientReviewLabel } from "@/lib/portalReview";
import { FileText, Search, Calendar, CheckCircle, Clock, Pencil } from "lucide-react";

export default function PortalContent() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const token = getPortalToken();
    const userData = getPortalUserRaw();
    
    if (!token || !userData) {
      setLocation(portalLoginPath());
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [setLocation]);

  const { data: contentList, isLoading, error, refetch } = trpc.clientPortal.myContent.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const clientContent = contentList || [];

  // Apply search and status filters
  const filteredContent = clientContent.filter((item) => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.clientReview === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (state: string | null) => {
    switch (state) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "changes_requested":
        return <Pencil className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filters: { value: string; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Awaiting review" },
    { value: "changes_requested", label: "Changes requested" },
    { value: "approved", label: "Approved" },
  ];

  return (
    <PortalShell title="Content" subtitle="Everything we've shared with you">
        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <Button
                  key={f.value}
                  variant={statusFilter === f.value ? "default" : "outline"}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Content List */}
        {error ? (
          <PortalError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading content...</div>
          </div>
        ) : filteredContent.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No content found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Pieces our team shares with you for review will appear here"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredContent.map((item) => (
              <Link key={item.id} href={`/portal/content/${item.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(item.clientReview)}
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.topic}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                        {item.scheduledPublishDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Scheduled: {new Date(item.scheduledPublishDate).toLocaleDateString()}
                          </div>
                        )}
                        {item.wordCount && (
                          <span>{item.wordCount} words</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={clientReviewBadgeClass(item.clientReview)}>
                        {clientReviewLabel(item.clientReview)}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </PortalShell>
  );
}
