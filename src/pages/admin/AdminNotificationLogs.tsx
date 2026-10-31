import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { format } from "date-fns";

function useNotificationLogs() {
  return useQuery({
    queryKey: ["admin-notification-logs"],
    queryFn: async () => {
      const [notifications, automationLogs] = await Promise.all([
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("automation_logs").select("*").order("sent_at", { ascending: false }).limit(200),
      ]);
      return {
        notifications: notifications.data || [],
        automationLogs: automationLogs.data || [],
      };
    },
  });
}

export default function AdminNotificationLogs() {
  const { data, isLoading } = useNotificationLogs();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"notifications" | "automation">("notifications");

  const notifications = data?.notifications || [];
  const automationLogs = data?.automationLogs || [];

  const filteredNotifications = notifications.filter((n: any) =>
    n.title.toLowerCase().includes(search.toLowerCase()) || (n.message || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredAutomation = automationLogs.filter((l: any) =>
    (l.message || "").toLowerCase().includes(search.toLowerCase()) || l.channel.toLowerCase().includes(search.toLowerCase())
  );

  const failedCount = automationLogs.filter((l: any) => l.status === "failed").length;
  const sentCount = automationLogs.filter((l: any) => l.status === "sent").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Notification & Email Logs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform-wide view of sent notifications and automation logs.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Notifications", value: notifications.length, icon: Bell, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Automation Sent", value: sentCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Failed Deliveries", value: failedCount, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
        ].map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold"><AnimatedCounter value={s.value} /></p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant={tab === "notifications" ? "default" : "outline"} onClick={() => setTab("notifications")} className="text-xs">Notifications</Button>
          <Button size="sm" variant={tab === "automation" ? "default" : "outline"} onClick={() => setTab("automation")} className="text-xs">Automation Logs</Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {tab === "notifications" ? (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground"><Bell className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No notifications</p></div>
              ) : filteredNotifications.map((n: any) => (
                <div key={n.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{n.title}</span>
                    <Badge variant="outline" className="text-[10px]">{n.type}</Badge>
                    {n.is_read && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600">Read</Badge>}
                  </div>
                  {n.message && <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "MMM d, yyyy h:mm a")}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {filteredAutomation.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground"><Mail className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No automation logs</p></div>
              ) : filteredAutomation.map((l: any) => (
                <div key={l.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{l.channel}</Badge>
                    <Badge className={`text-[10px] ${l.status === "sent" ? "bg-emerald-500/10 text-emerald-600" : l.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{l.status}</Badge>
                  </div>
                  {l.message && <p className="text-xs text-muted-foreground line-clamp-1">{l.message}</p>}
                  {l.error_message && <p className="text-xs text-destructive mt-0.5">{l.error_message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(l.sent_at), "MMM d, yyyy h:mm a")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
