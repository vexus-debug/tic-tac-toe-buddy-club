import { useMemo, useState } from "react";
import { useActiveSessions, isOnline } from "@/hooks/useActiveSessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Monitor, Smartphone, Tablet, MapPin, Download, Users, Wifi } from "lucide-react";

function DeviceIcon({ type }: { type: string | null }) {
  if (type === "Mobile") return <Smartphone className="h-4 w-4 text-muted-foreground" />;
  if (type === "Tablet") return <Tablet className="h-4 w-4 text-muted-foreground" />;
  return <Monitor className="h-4 w-4 text-muted-foreground" />;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminLiveSessions() {
  const { data, isLoading } = useActiveSessions();
  const [search, setSearch] = useState("");

  const sessions = useMemo(() => {
    const rows = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) =>
      [s.full_name, s.org_slug, s.city, s.country, s.os, s.browser, s.device_type]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, search]);

  const online = (data ?? []).filter((s) => isOnline(s.last_seen_at));
  const pwaDevices = (data ?? []).filter((s) => s.is_pwa);
  const uniqueUsers = new Set(online.map((s) => s.user_id)).size;

  const stats = [
    { label: "Online now", value: online.length, icon: Wifi },
    { label: "Unique users online", value: uniqueUsers, icon: Users },
    { label: "PWA installs", value: pwaDevices.length, icon: Download },
    { label: "Tracked devices", value: (data ?? []).length, icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Sessions</h1>
        <p className="text-sm text-muted-foreground">
          Who is signed in right now, where they are, what device they use, and where the app is installed.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xl font-semibold">{isLoading ? "—" : s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Sessions</CardTitle>
          <Input
            placeholder="Search user, clinic, location, device…"
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
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sessions recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Last seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name || s.user_id.slice(0, 8)}</TableCell>
                    <TableCell>
                      {isOnline(s.last_seen_at) ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">Online</Badge>
                      ) : (
                        <Badge variant="outline">Offline</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <DeviceIcon type={s.device_type} />
                        <span>
                          {[s.os, s.browser].filter(Boolean).join(" · ") || s.device_type || "Unknown"}
                        </span>
                        {s.is_pwa && (
                          <Badge variant="secondary" className="text-[10px]">PWA</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {[s.city, s.region, s.country].filter(Boolean).join(", ") || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.ip || ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{s.org_slug || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {s.current_path || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(s.last_seen_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
