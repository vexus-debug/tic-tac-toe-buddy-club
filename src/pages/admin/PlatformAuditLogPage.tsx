import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Shield, Clock, UserCog, Building2, Key, Ban } from "lucide-react";
import { usePlatformAuditLog } from "@/hooks/usePlatformAuditLog";
import { useAllProfiles } from "@/hooks/useAdminData";
import { format } from "date-fns";
import { motion } from "framer-motion";

const actionIcons: Record<string, typeof Shield> = {
  user_status_changed: Ban,
  role_assigned: UserCog,
  role_revoked: Key,
  password_reset: Key,
};

const actionColors: Record<string, string> = {
  user_status_changed: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  role_assigned: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  role_revoked: "bg-red-500/10 text-red-600 border-red-500/20",
  password_reset: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export default function PlatformAuditLogPage() {
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const { data: logs = [], isLoading } = usePlatformAuditLog({
    action: actionFilter || undefined,
  });
  const { data: profiles } = useAllProfiles();

  const profileMap = new Map<string, string>();
  (profiles || []).forEach((p: any) => profileMap.set(p.id, p.full_name || "Unknown"));

  const filtered = logs.filter((l) =>
    (profileMap.get(l.admin_user_id) || "").toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.target_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const actionTypes = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Platform Audit Log
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track all super admin actions across the platform.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by admin, action, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((a) => (
              <SelectItem key={a} value={a} className="capitalize">
                {a.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading audit log...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No audit log entries found.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map((log) => {
                  const IconComp = actionIcons[log.action] || Shield;
                  const colorClass = actionColors[log.action] || "bg-muted text-muted-foreground";
                  const adminName = profileMap.get(log.admin_user_id) || "Unknown Admin";
                  const targetName = log.target_id ? (profileMap.get(log.target_id) || log.target_id.slice(0, 8)) : "—";
                  const details = log.details as Record<string, unknown> | null;

                  return (
                    <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {log.target_type}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">
                          <span className="font-medium">{adminName}</span>
                          {" → "}
                          <span className="text-muted-foreground">{targetName}</span>
                        </p>
                        {details && Object.keys(details).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(", ")}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
