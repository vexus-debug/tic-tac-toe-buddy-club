import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Users, UserCheck, ExternalLink, Trash2, Settings, Pencil } from "lucide-react";
import { useAllOrganizations, useOrgMemberCounts, useOrgPatientCounts } from "@/hooks/useAdminData";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { CreateClinicDialog } from "@/components/admin/CreateClinicDialog";
import { EditClinicDialog } from "@/components/admin/EditClinicDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminClinics() {
  const { data: orgs, isLoading } = useAllOrganizations();
  const { data: memberCounts } = useOrgMemberCounts();
  const { data: patientCounts } = useOrgPatientCounts();
  const [search, setSearch] = useState("");
  const [editOrg, setEditOrg] = useState<any>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const filtered = (orgs || []).filter((o: any) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (orgId: string, orgName: string) => {
    const { error } = await supabase.from("organizations").delete().eq("id", orgId);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `"${orgName}" deleted` });
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-platform-stats"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Clinics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create, manage, and access all registered clinics.</p>
        </div>
        <CreateClinicDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clinics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardContent className="p-5 space-y-3">
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No clinics found</p>
          </div>
        ) : filtered.map((org: any) => (
          <Card key={org.id} className="glass-card hover:shadow-md transition-all duration-200 group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="text-[10px] capitalize">{org.clinic_type}</Badge>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{org.name}</h3>
              <p className="text-xs text-muted-foreground mb-1">/{org.slug}</p>
              {org.email && <p className="text-xs text-muted-foreground mb-0.5">{org.email}</p>}
              {org.phone && <p className="text-xs text-muted-foreground mb-0.5">{org.phone}</p>}
              <div className="flex items-center gap-4 text-xs text-muted-foreground my-3">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {memberCounts?.[org.id] || 0} members
                </span>
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5" />
                  {patientCounts?.[org.id] || 0} patients
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Created {format(new Date(org.created_at), "MMM d, yyyy")}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => navigate(`/admin/clinics/${org.slug}`)}
                  >
                    <ExternalLink className="h-3 w-3" /> Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                    onClick={() => setEditOrg(org)}
                    aria-label={`Edit ${org.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{org.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this clinic and may affect associated data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(org.id, org.name)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EditClinicDialog
        org={editOrg}
        open={!!editOrg}
        onOpenChange={(o) => { if (!o) setEditOrg(null); }}
      />
    </div>
  );
}
