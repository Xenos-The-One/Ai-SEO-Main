import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { PortalShell, PortalError } from "@/components/portal/PortalShell";
import { clientReviewLabel } from "@/lib/portalReview";
import { getPortalToken, getPortalUserRaw, portalLoginPath } from "@/lib/portalSession";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export default function PortalCalendar() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  useEffect(() => {
    const token = getPortalToken();
    const userData = getPortalUserRaw();
    
    if (!token || !userData) {
      setLocation(portalLoginPath());
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [setLocation]);

  // Portal-scoped content (token-authenticated); the agency content.list endpoint isn't
  // available to a client login, so use the portal endpoint.
  const { data: contentList, error, refetch } = trpc.clientPortal.myContent.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // The date a piece sits on: its scheduled publish date if set, else when it was created.
  const effectiveDate = (item: any) => item.scheduledPublishDate || item.createdAt;
  const clientContent = (contentList || []).filter((item: any) => !!effectiveDate(item));

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getContentForDate = (date: Date) => {
    return clientContent.filter((item: any) => {
      const d = new Date(effectiveDate(item));
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStatusColor = (state: string | null) => {
    switch (state) {
      case "approved":
        return "bg-green-500/20 text-green-500 border-green-500/50";
      case "pending":
        return "bg-orange-500/20 text-orange-500 border-orange-500/50";
      case "changes_requested":
        return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  return (
    <PortalShell title="Calendar" subtitle="When your content is scheduled">
        {error && <div className="mb-6"><PortalError onRetry={() => refetch()} /></div>}
        {/* Calendar Controls */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {monthNames[month]} {year}
              </h2>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("month")}
              >
                Month
              </Button>
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
              >
                Week
              </Button>
            </div>
          </div>
        </Card>

        {/* Calendar Grid */}
        <Card className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const content = getContentForDate(date);
              const isToday =
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={index}
                  className={`aspect-square border rounded-lg p-2 ${
                    isToday ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="text-sm font-medium mb-2">{date.getDate()}</div>
                  <div className="space-y-1">
                    {content.slice(0, 3).map((item: any) => (
                      <Link key={item.id} href={`/portal/content/${item.id}`}>
                        <div
                          className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 transition-opacity truncate ${getStatusColor(
                            item.clientReview
                          )}`}
                          title={item.title}
                        >
                          {item.title}
                        </div>
                      </Link>
                    ))}
                    {content.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{content.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Content schedule list */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Content Schedule</h3>
          {clientContent.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No content yet</p>
              <p className="text-sm mt-1">Your published and scheduled content will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientContent
                .slice()
                .sort((a: any, b: any) =>
                  new Date(effectiveDate(b)).getTime() - new Date(effectiveDate(a)).getTime()
                )
                .slice(0, 10)
                .map((item: any) => (
                  <Link key={item.id} href={`/portal/content/${item.id}`}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(effectiveDate(item)).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge className={getStatusColor(item.clientReview)}>
                        {clientReviewLabel(item.clientReview)}
                      </Badge>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </Card>
    </PortalShell>
  );
}
