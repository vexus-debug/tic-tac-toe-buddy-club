import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Ticket, MessageSquare, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useAllProfiles } from "@/hooks/useAdminData";

function useTickets() {
  return useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function useTicketReplies(ticketId: string | null) {
  return useQuery({
    queryKey: ["admin-ticket-replies", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await (supabase as any)
        .from("support_ticket_replies")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!ticketId,
  });
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-500/10 text-blue-600",
  high: "bg-amber-500/10 text-amber-600",
  urgent: "bg-destructive/10 text-destructive",
};

export default function AdminSupportTickets() {
  const { data: tickets = [], isLoading } = useTickets();
  const { data: profiles } = useAllProfiles();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const { data: replies = [] } = useTicketReplies(selectedTicket?.id);

  const profileMap = new Map<string, string>();
  (profiles || []).forEach((p: any) => profileMap.set(p.id, p.full_name || "Unknown"));

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("support_tickets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast({ title: "Ticket updated" });
    },
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("support_ticket_replies").insert({
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: reply,
        is_admin: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-replies", selectedTicket.id] });
      setReply("");
      toast({ title: "Reply sent" });
    },
  });

  const filtered = tickets.filter((t: any) => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Support Tickets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage helpdesk tickets from clinic owners.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize text-xs">
              {s.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">Subject</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">User</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">Status</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">Priority</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs hidden md:table-cell">Created</th>
                  <th className="py-2.5 px-4 text-right font-medium text-muted-foreground text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No tickets found</p>
                  </td></tr>
                ) : filtered.map((t: any) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedTicket(t)}>
                    <td className="py-3 px-4 font-medium">{t.subject}</td>
                    <td className="py-3 px-4 text-muted-foreground">{profileMap.get(t.user_id) || t.user_id?.slice(0, 8)}</td>
                    <td className="py-3 px-4"><Badge className={`text-[10px] ${statusColors[t.status] || ""}`}>{t.status}</Badge></td>
                    <td className="py-3 px-4"><Badge variant="outline" className={`text-[10px] ${priorityColors[t.priority] || ""}`}>{t.priority}</Badge></td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{format(new Date(t.created_at), "MMM d, yyyy")}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Select value={t.status} onValueChange={(v) => updateStatus.mutate({ id: t.id, status: v })}>
                        <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedTicket?.subject}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge className={`text-[10px] ${statusColors[selectedTicket?.status] || ""}`}>{selectedTicket?.status}</Badge>
              <Badge variant="outline" className={`text-[10px] ${priorityColors[selectedTicket?.priority] || ""}`}>{selectedTicket?.priority}</Badge>
              <Badge variant="secondary" className="text-[10px]">{selectedTicket?.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{selectedTicket?.description}</p>
            <div className="border-t pt-4 space-y-3 max-h-[250px] overflow-y-auto">
              {replies.map((r: any) => (
                <div key={r.id} className={`p-3 rounded-lg text-sm ${r.is_admin ? "bg-primary/5 ml-4" : "bg-muted/50 mr-4"}`}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{r.is_admin ? "Admin" : profileMap.get(r.user_id) || "User"}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(r.created_at), "MMM d, h:mm a")}</span>
                  </div>
                  <p>{r.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea placeholder="Type a reply..." value={reply} onChange={(e) => setReply(e.target.value)} rows={2} className="flex-1" />
              <Button onClick={() => sendReply.mutate()} disabled={!reply.trim()} className="self-end">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
