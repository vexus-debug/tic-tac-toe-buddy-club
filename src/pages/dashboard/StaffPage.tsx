import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Search, UserCog } from "lucide-react";
import { useStaff, type StaffMember } from "@/hooks/useStaff";
import { useOrg } from "@/hooks/useOrg";
import { AddStaffDialog } from "@/components/dashboard/AddStaffDialog";
import { EditStaffDialog } from "@/components/dashboard/EditStaffDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ProviderBadge, isContracted } from "@/components/dashboard/associate/ProviderBadge";

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
};

export default function StaffPage() {
  const { data: staff = [], isLoading } = useStaff();
  const { currentOrg } = useOrg();
  const orgRole = currentOrg?.role || "";
  const canManageStaff = ["owner", "admin", "manager"].includes(orgRole);

  const [addOpen, setAddOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [query, setQuery] = useState("");
  const [onlyAssociates, setOnlyAssociates] = useState(false);
  const visibleStaff = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = onlyAssociates ? staff.filter((m) => isContracted(m.provider_type)) : staff;
    if (!term) return base;
    return base.filter((member) =>
      [member.full_name, member.role, member.specialty, member.phone]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term)),
    );
  }, [query, staff, onlyAssociates]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        description={`${staff.length} team members`}
        tutorial={{
          title: "Staff Management — How to Use",
          description: "Add, edit, and manage all clinic staff members and their system access roles.",
          steps: [
            {
              title: "View staff cards",
              description: "Each card shows a staff member's name, role, phone, email, and join date. Roles are color-coded: blue for Dentists, green for Hygienists, amber for Receptionists, and rose for Accountants.",
            },
            {
              title: "Add a new staff member",
              description: "Click 'Add Staff'. Enter their full name, email, phone, role, and specialty. The role determines which pages and features they can access in the system.",
              tip: "Choose roles carefully. Dentists see clinical pages. Receptionists see scheduling and patients. Accountants see billing and reports.",
            },
            {
              title: "Edit staff details",
              description: "Click the pencil icon on any staff card to edit their information or change their role. Changes take effect immediately.",
            },
            {
              title: "Understand roles & access",
              description: "Owner/Admin: full access to all pages. Dentist: clinical + scheduling. Receptionist: patients + appointments. Accountant: billing + reports. Hygienist/Assistant: limited clinical access.",
            },
            {
              title: "Manage staff accounts",
              description: "Each staff member has a login account. If a staff member leaves, you can deactivate their access to preserve historical records without deleting their data.",
            },
          ],
          nextPageHint: {
            label: "Schedules",
            description: "After adding dentists, configure their working hours on the Schedules page so appointments can be booked correctly.",
          },
        }}
      >
        {canManageStaff && (
          <Button data-tour="staff-add" size="sm" className="h-10 rounded-lg bg-secondary px-4 font-semibold shadow-lg shadow-secondary/20 hover:bg-secondary/90" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Staff
          </Button>
        )}
      </PageHeader>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search staff by name, role or phone"
          aria-label="Search staff"
          className="h-11 rounded-lg border-border/70 bg-card/80 pl-10 shadow-sm"
        />
      </div>
      <div className="flex gap-2" role="group" aria-label="Filter providers">
        <Button size="sm" variant={onlyAssociates ? "outline" : "secondary"} onClick={() => setOnlyAssociates(false)}>All staff</Button>
        <Button size="sm" variant={onlyAssociates ? "secondary" : "outline"} onClick={() => setOnlyAssociates(true)}>Associates &amp; locums</Button>
      </div>

      {isLoading ? (
        <div className="grid max-w-4xl gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden rounded-lg border-border/70 bg-card"><CardContent className="p-4"><div className="flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-24 rounded-full" /></div><Skeleton className="h-12 w-14 rounded-lg" /></div></CardContent></Card>
          ))}
        </div>
      ) : staff.length === 0 ? (
        <EmptyState icon={UserCog} title="No staff members" description="Add team members to manage your clinic staff." actionLabel="Add Staff" onAction={() => setAddOpen(true)} />
      ) : visibleStaff.length === 0 ? (
        <EmptyState icon={Search} title="No matching staff" description="Try a different name, role, or phone number." />
      ) : (
        <motion.div data-tour="staff-grid" className="grid max-w-4xl gap-3 lg:grid-cols-2" variants={stagger.container} initial="hidden" animate="visible">
          {visibleStaff.map((member) => (
            <motion.div key={member.id} variants={stagger.item}>
              <Card className="group overflow-hidden rounded-lg border-border/70 bg-card shadow-sm transition-all duration-200 hover:border-secondary/40 hover:shadow-md hover:shadow-secondary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative shrink-0">
                      <Avatar className="h-14 w-14 border border-secondary/20 bg-accent ring-0 transition-colors group-hover:border-secondary/40">
                        <AvatarFallback className="bg-accent text-secondary text-base font-bold">
                        {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card ${member.status === "active" ? "bg-success" : "bg-muted-foreground"}`} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-secondary">{member.full_name}</p>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${member.status === "active" ? "border-success/20 bg-success/10 text-success" : "border-border bg-muted text-muted-foreground"}`}>
                          {member.status}
                        </span>
                        {["dentist", "hygienist"].includes(member.role) && <ProviderBadge type={member.provider_type} />}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{member.specialty || member.role.replace(/_/g, " ")}</p>
                      <div className="mt-2 flex min-w-0 items-center gap-2">
                        <span data-tour="staff-role-badge" className="inline-flex shrink-0 items-center rounded-md bg-background/70 px-2 py-0.5 text-[10px] font-semibold capitalize text-secondary">
                          {member.role.replace(/_/g, " ")}
                        </span>
                        {member.phone && <span className="truncate font-mono text-[10px] text-muted-foreground">{member.phone}</span>}
                      </div>
                    </div>
                    {canManageStaff && (
                      <Button data-tour="staff-edit" variant="outline" className="h-12 w-14 shrink-0 flex-col gap-1 rounded-lg border-border/80 bg-background/40 px-2 text-[11px] font-semibold hover:border-secondary/40 hover:bg-secondary hover:text-secondary-foreground sm:w-auto sm:flex-row sm:px-3" onClick={() => setEditStaff(member)} aria-label={`Edit ${member.full_name}`}>
                        <Pencil className="h-4 w-4" />
                        <span>Edit</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AddStaffDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditStaffDialog staff={editStaff} open={!!editStaff} onOpenChange={(o) => !o && setEditStaff(null)} />
    </div>
  );
}