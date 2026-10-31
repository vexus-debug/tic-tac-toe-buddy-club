import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Monitor, Smartphone, Tablet, MapPin, Eye, Users, Timer, TrendingUp,
  Globe, Link2, Cpu, Clock, MousePointerClick, ArrowDownWideNarrow,
} from "lucide-react";

interface VisitorSession {
  id: string;
  session_id: string;
  visitor_id: string;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  referrer_url: string | null;
  referrer_name: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  exit_page: string | null;
  user_agent: string | null;
  fingerprint_hash: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  screen_resolution: string | null;
  pixel_ratio: string | null;
  gpu_renderer: string | null;
  cpu_cores: number | null;
  device_memory_gb: number | null;
  timezone: string | null;
  locale: string | null;
  touch_points: number | null;
  is_pwa: boolean;
  duration_seconds: number;
  page_views_count: number;
  is_bounced: boolean;
  started_at: string;
  last_seen_at: string;
}

interface VisitorEvent {
  id: string;
  session_id: string;
  path: string | null;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function isOnline(lastSeen: string) {
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function DeviceIcon({ type }: { type: string | null }) {
  if (type === "Mobile") return <Smartphone className="h-4 w-4 text-muted-foreground" />;
  if (type === "Tablet") return <Tablet className="h-4 w-4 text-muted-foreground" />;
  return <Monitor className="h-4 w-4 text-muted-foreground" />;
}

function locationLabel(s: VisitorSession) {
  return [s.city, s.country].filter(Boolean).join(", ") || "Unknown";
}

function sourceLabel(s: VisitorSession) {
  const utm = [s.utm_source, s.utm_campaign].filter(Boolean).join(" · ");
  if (utm) return utm;
  return s.referrer_name || "Direct";
}

function BreakdownCard({
  title, icon: Icon, rows,
}: {
  title: string;
  icon: React.ElementType;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium truncate max-w-[70%]">{r.label}</span>
                <span className="text-muted-foreground">{r.count}</span>
              </div>
              <Progress value={(r.count / max) * 100} className="h-1.5" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminVisitors() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VisitorSession | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-visitor-sessions"],
    refetchInterval: 30_000,
    queryFn: async (): Promise<VisitorSession[]> => {
      const { data, error } = await supabase
        .from("visitor_sessions")
        .select("*")
        .order("last_seen_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as VisitorSession[];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["visitor-events", selected?.session_id],
    enabled: !!selected,
    queryFn: async (): Promise<VisitorEvent[]> => {
      const { data, error } = await supabase
        .from("visitor_events")
        .select("*")
        .eq("session_id", selected!.session_id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as VisitorEvent[];
    },
  });

  const sessions = data ?? [];

  const stats = useMemo(() => {
    const online = sessions.filter((s) => isOnline(s.last_seen_at));
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = sessions.filter((s) => new Date(s.started_at) >= todayStart);
    const avgDuration = today.length
      ? Math.round(today.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / today.length)
      : 0;
    const bounceRate = today.length
      ? Math.round((today.filter((s) => s.is_bounced).length / today.length) * 100)
      : 0;
    const uniqueVisitors = new Set(sessions.map((s) => s.visitor_id)).size;
    return [
      { label: "Online now", value: online.length, icon: Eye },
      { label: "Visits today", value: today.length, icon: Users },
      { label: "Unique visitors", value: uniqueVisitors, icon: Globe },
      { label: "Avg visit length", value: formatDuration(avgDuration), icon: Timer },
      { label: "Bounce rate", value: `${bounceRate}%`, icon: TrendingUp },
    ];
  }, [sessions]);

  const breakdowns = useMemo(() => {
    const tally = (list: (string | null)[], fallback: string) => {
      const map = new Map<string, number>();
      for (const item of list) {
        const key = item || fallback;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      return [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, count]) => ({ label, count }));
    };
    return {
      sources: tally(sessions.map((s) => s.referrer_name ?? s.utm_source), "Direct"),
      countries: tally(sessions.map((s) => s.country), "Unknown"),
      devices: tally(sessions.map((s) => s.device_type), "Desktop"),
    };
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) =>
      [s.country, s.city, s.region, s.device_type, s.os, s.browser, s.referrer_name,
        s.utm_source, s.utm_campaign, s.landing_page, s.exit_page, s.timezone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [sessions, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Website Visitors</h1>
        <p className="text-sm text-muted-foreground">
          Who visits the public website, where they come from, what device they use, what they read and how long they stay.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-semibold">{isLoading ? "—" : s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <BreakdownCard title="Traffic sources" icon={Link2} rows={breakdowns.sources} />
        <BreakdownCard title="Countries" icon={Globe} rows={breakdowns.countries} />
        <BreakdownCard title="Devices" icon={Cpu} rows={breakdowns.devices} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Visits</CardTitle>
          <Input
            placeholder="Search country, device, source, page…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No website visits recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Landing page</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Last seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(s)}
                  >
                    <TableCell>
                      {isOnline(s.last_seen_at) ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">Online</Badge>
                      ) : (
                        <Badge variant="outline">Offline</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {locationLabel(s)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <DeviceIcon type={s.device_type} />
                        <span>{[s.os, s.browser].filter(Boolean).join(" · ") || s.device_type || "Unknown"}</span>
                        {s.is_pwa && <Badge variant="secondary" className="text-[10px]">PWA</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{sourceLabel(s)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {s.landing_page || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{s.page_views_count}</TableCell>
                    <TableCell className="text-sm flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDuration(s.duration_seconds || 0)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(s.last_seen_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {selected && (
            <>
              <SheetHeader className="px-4 pt-4 pb-2 border-b">
                <SheetTitle className="text-base flex items-center gap-2">
                  <DeviceIcon type={selected.device_type} />
                  {locationLabel(selected)}
                  {isOnline(selected.last_seen_at) && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">Online</Badge>
                  )}
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                  {/* Source & timing */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Source</p>
                      <p className="font-medium">{sourceLabel(selected)}</p>
                      {selected.referrer_url && (
                        <p className="text-xs text-muted-foreground break-all">{selected.referrer_url}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatDuration(selected.duration_seconds || 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {selected.page_views_count} page{selected.page_views_count === 1 ? "" : "s"}
                        {selected.is_bounced && " · bounced"}
                      </p>
                    </div>
                  </div>

                  {/* Device fingerprint */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Cpu className="h-4 w-4" /> Device fingerprint
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {[
                        ["Device", selected.device_type],
                        ["OS", selected.os],
                        ["Browser", selected.browser],
                        ["Screen", selected.screen_resolution ? `${selected.screen_resolution} @${selected.pixel_ratio || "1"}x` : null],
                        ["GPU", selected.gpu_renderer],
                        ["CPU cores", selected.cpu_cores ? String(selected.cpu_cores) : null],
                        ["Memory", selected.device_memory_gb ? `≥${selected.device_memory_gb} GB` : null],
                        ["Timezone", selected.timezone],
                        ["Language", selected.locale],
                        ["Touch points", selected.touch_points !== null ? String(selected.touch_points) : null],
                        ["IP", selected.ip],
                        ["Fingerprint", selected.fingerprint_hash ? selected.fingerprint_hash.slice(0, 12) : null],
                      ].map(([label, value]) => (
                        <div key={label as string}>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="font-medium truncate" title={value ?? ""}>{value || "—"}</p>
                        </div>
                      ))}
                      {selected.user_agent && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">User agent</p>
                          <p className="font-medium text-xs break-all">{selected.user_agent}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Journey */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4" /> Journey
                    </h3>
                    {!events || events.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No events recorded for this visit.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {events.map((e) => (
                          <div key={e.id} className="flex items-start gap-2.5 text-sm rounded-lg border p-2.5">
                            <Badge
                              variant="outline"
                              className="mt-0.5 shrink-0 text-[10px] uppercase tracking-wide"
                            >
                              {e.event_type === "scroll" ? (
                                <ArrowDownWideNarrow className="h-3 w-3" />
                              ) : e.event_type === "click" ? (
                                <MousePointerClick className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                              {e.event_type}
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{e.path || "—"}</p>
                              {e.metadata && Object.keys(e.metadata).length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {Object.entries(e.metadata).map(([k, v]) => `${k}: ${v}`).join(", ")}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
