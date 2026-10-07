import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { clearPortalSession, getPortalUser, portalLoginPath } from "@/lib/portalSession";

const NAV = [
  { href: "/portal/dashboard", label: "Dashboard" },
  { href: "/portal/content", label: "Content" },
  { href: "/portal/approvals", label: "Approvals" },
  { href: "/portal/calendar", label: "Calendar" },
  { href: "/portal/performance", label: "Performance" },
];

/**
 * The frame every signed-in portal page shares: the client's branding, navigation, the
 * signed-in user with logout, and a browser-tab title that names the client's portal
 * rather than the platform.
 */
export function PortalShell({
  title,
  subtitle,
  actions,
  back,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  const [location, setLocation] = useLocation();
  const user = getPortalUser();
  const { data: branding } = trpc.clientPortal.branding.useQuery(undefined, { enabled: !!user });
  const { data: me } = trpc.clientPortal.me.useQuery(undefined, { enabled: !!user });

  const portalName = branding?.portalName || me?.clientName || "Client Portal";
  const brandColor = branding?.primaryColor || undefined;

  useEffect(() => {
    document.title = typeof title === "string" ? `${title} · ${portalName}` : portalName;
  }, [title, portalName]);

  const handleLogout = () => {
    const loginPath = portalLoginPath();
    clearPortalSession();
    setLocation(loginPath);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card" style={brandColor ? { borderBottomColor: brandColor } : undefined}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 py-3">
            <Link href="/portal/dashboard" className="flex items-center gap-3 min-w-0">
              {branding?.logoUrl && <img src={branding.logoUrl} alt="" className="h-8 w-auto object-contain" />}
              <span className="font-bold text-lg truncate" style={brandColor ? { color: brandColor } : undefined}>
                {portalName}
              </span>
            </Link>
            <div className="flex items-center gap-3 shrink-0">
              {user && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium leading-tight">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role === "client_admin" ? "Admin" : "Viewer"}</p>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          </div>
          <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Portal">
            {NAV.map((item) => {
              const active = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
                    active
                      ? "font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  style={active ? { borderBottomColor: brandColor ?? "var(--primary)" } : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {back && (
          <Link href={back.href} className="mb-3 inline-block text-sm text-muted-foreground hover:text-foreground">
            ← {back.label}
          </Link>
        )}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold break-words">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}

/** A failed load, with a retry. Used in place of a page's content when its data can't load. */
export function PortalError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <Card className="p-10 text-center">
      <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
      <h3 className="text-lg font-semibold mb-1">We couldn't load this</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {message || "Something went wrong on our side."} Please try again in a moment.
      </p>
      {onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
    </Card>
  );
}
