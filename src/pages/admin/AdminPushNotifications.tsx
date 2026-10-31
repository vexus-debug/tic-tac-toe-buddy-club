import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send, BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { sendPushNotification } from "@/lib/push.functions";
import { EnablePushCard } from "@/components/EnablePushCard";

export default function AdminPushNotifications() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<"all" | "clinic" | "user">("all");
  const [orgId, setOrgId] = useState("");
  const [userId, setUserId] = useState("");
  const [sending, setSending] = useState(false);

  const { data: orgs = [] } = useQuery({
    queryKey: ["push-orgs"],
    queryFn: async () => (await supabase.from("organizations").select("id,name").order("name")).data ?? [],
  });
  const { data: users = [] } = useQuery({
    queryKey: ["push-users"],
    queryFn: async () => (await supabase.from("profiles").select("id,full_name").order("full_name")).data ?? [],
  });
  const { data: history = [] } = useQuery({
    queryKey: ["push-history"],
    queryFn: async () =>
      ((await (supabase as any).from("push_messages").select("*").order("created_at", { ascending: false }).limit(30)).data ?? []) as any[],
  });
  const { data: deviceCount = 0 } = useQuery({
    queryKey: ["push-devices"],
    queryFn: async () => (await (supabase as any).from("push_subscriptions").select("id", { count: "exact", head: true })).count ?? 0,
  });

  const send = async () => {
    if (!title.trim() || !body.trim()) return toast({ title: "Add a title and message", variant: "destructive" });
    setSending(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await sendPushNotification({
        data: { token: s.session?.access_token ?? "", title, body, targetType: target, orgId: orgId || null, userId: userId || null },
      });
      toast({ title: "Notification sent", description: `Delivered to ${res.sent} of ${res.devices} device(s).` });
      setTitle(""); setBody("");
      qc.invalidateQueries({ queryKey: ["push-history"] });
    } catch (e: any) {
      toast({ title: "Couldn't send", description: e?.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const targetLabel = (m: any) =>
    m.target_type === "all" ? "Everyone"
      : m.target_type === "clinic" ? orgs.find((o: any) => o.id === m.target_org_id)?.name ?? "Clinic"
      : users.find((u: any) => u.id === m.target_user_id)?.full_name ?? "User";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Push Notifications</h1>
        <p className="text-sm text-muted-foreground">Send messages that pop up on users' phones. {deviceCount} device(s) signed up.</p>
      </div>
      <EnablePushCard />
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scheduled maintenance tonight" /></div>
          <div className="space-y-1.5"><Label>Message</Label><Textarea rows={5} value={body} maxLength={1500} onChange={(e) => setBody(e.target.value)} placeholder="Full message shown when they tap the notification" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Send to</Label>
              <Select value={target} onValueChange={(v: any) => setTarget(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="clinic">One clinic</SelectItem>
                  <SelectItem value="user">One user</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {target === "clinic" && (
              <div className="space-y-1.5">
                <Label>Clinic</Label>
                <Select value={orgId} onValueChange={setOrgId}>
                  <SelectTrigger><SelectValue placeholder="Choose clinic" /></SelectTrigger>
                  <SelectContent>{orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {target === "user" && (
              <div className="space-y-1.5">
                <Label>User</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger><SelectValue placeholder="Choose user" /></SelectTrigger>
                  <SelectContent>{users.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 8)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button onClick={send} disabled={sending}><Send className="mr-2 h-4 w-4" />{sending ? "Sending..." : "Send notification"}</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Sent</h2>
        {history.length === 0 && <p className="text-sm text-muted-foreground">Nothing sent yet.</p>}
        {history.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex gap-3 p-4">
              <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{m.title}</p>
                  <Badge variant="outline" className="text-[10px]">{targetLabel(m)}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{m.sent_count} delivered</Badge>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{m.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{format(new Date(m.created_at), "PP p")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
