import { useState } from "react";
import { ActiveVisitBar } from "@/components/dashboard/PatientVisitBar";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/hooks/useOrg";
import { getClinicTerms } from "@/config/clinicTerminology";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, UserPlus, Filter, MoreHorizontal, ArrowUpDown, Users, Phone, MessageCircle,
  LayoutGrid, LayoutList, Calendar,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddPatientDialog } from "@/components/dashboard/AddPatientDialog";
import { BookAppointmentDialog } from "@/components/dashboard/BookAppointmentDialog";
import { usePatients } from "@/hooks/usePatients";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
};

export default function PatientsPage() {
  const navigate = useNavigate();
  const { basePath, currentOrg } = useOrg();
  const orgRole = currentOrg?.role || "";
  const canViewContact = ["owner", "admin", "receptionist"].includes(orgRole);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [addOpen, setAddOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const { data: patients = [], isLoading } = usePatients();

  const filtered = patients
    .filter((p) => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        (canViewContact && (p.phone || '').includes(search));
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      if (sortBy === "registered") return b.registered_date.localeCompare(a.registered_date);
      return 0;
    });

  const activeCount = patients.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-5">
      <ActiveVisitBar />
      <PageHeader
        title="Patients"
        description={`${patients.length} total · ${activeCount} active`}
        tutorial={{
          title: "Patients — How to Use",
          description: "Register, search, and manage all your patients from this page.",
          steps: [
            {
              title: "Browse your patient list",
              description: "All registered patients appear here. You can switch between Table view (rows) and Grid view (cards) using the toggle buttons on the right side of the toolbar.",
              tip: "Grid view is great for quickly spotting patients by name. Table view shows more details at once.",
            },
            {
              title: "Search for a patient",
              description: "Use the search bar to find a patient by name, ID, or phone number. Results update instantly as you type.",
            },
            {
              title: "Filter by status",
              description: "Use the Status dropdown to show only Active or Inactive patients. Active patients are currently receiving care; inactive ones have not visited recently.",
            },
            {
              title: "Register a new patient",
              description: "Click the 'Add Patient' button (top right). Fill in the patient's name, phone, email, date of birth, and any relevant medical history or allergies.",
              tip: "Always record allergies carefully — this appears as a warning during prescriptions and treatment.",
            },
            {
              title: "Open a patient profile",
              description: getClinicTerms(currentOrg?.clinic_type).patientProfileHelp,
            },
            {
              title: "Quick actions per patient",
              description: "Hover over a row and click the ⋯ menu to quickly book an appointment, call, or send a WhatsApp message to the patient without opening their full profile.",
            },
          ],
          nextPageHint: {
            label: "Book an Appointment",
            description: "Once a patient is registered, go to the Appointments page to schedule their first visit.",
          },
        }}
      >
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 gap-1.5"
          onClick={() => setAddOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Add Patient
        </Button>
      </PageHeader>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="border-border bg-card shadow-sm overflow-hidden">

          {/* Toolbar */}
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1" data-tour="patients-search">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID or phone…"
                  className="pl-8 h-9 bg-muted/40 border-border/50 focus-visible:ring-primary/30 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap" data-tour="patients-filters">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-9 text-sm bg-muted/40 border-border/50">
                    <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px] h-9 text-sm bg-muted/40 border-border/50">
                    <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">By Name</SelectItem>
                    <SelectItem value="registered">By Date</SelectItem>
                  </SelectContent>
                </Select>

                {/* View toggle */}
                <div className="flex border border-border/50 rounded-lg overflow-hidden" data-tour="patients-view-toggle">
                  <button
                    className={cn("px-2.5 py-1.5 transition-all", viewMode === "table" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/60")}
                    onClick={() => setViewMode("table")}
                    title="Table view"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className={cn("px-2.5 py-1.5 transition-all", viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/60")}
                    onClick={() => setViewMode("grid")}
                    title="Card view"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0" data-tour="patients-list">
            {isLoading ? (
              <TableSkeleton columns={6} rows={8} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No patients found"
                description="Try adjusting your search or filters, or add a new patient to get started."
                actionLabel="Add Patient"
                onAction={() => setAddOpen(true)}
              />
            ) : viewMode === "grid" ? (

              /* ── Card Grid View ── */
              <div className="p-4">
                <motion.div
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  variants={stagger.container}
                  initial="hidden"
                  animate="visible"
                >
                  {filtered.map((p) => {
                    const initials = `${p.first_name[0]}${p.last_name[0]}`.toUpperCase();
                    return (
                      <motion.div key={p.id} variants={stagger.item}>
                        <div
                          className="group relative p-4 rounded-xl border border-border hover:border-primary/30 bg-card hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => navigate(`${basePath}/patients/${p.id}`)}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-10 w-10 ring-2 ring-border group-hover:ring-primary/20 transition-all">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {p.first_name} {p.last_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">{p.id.slice(0, 8)}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              p.status === "active"
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-muted text-muted-foreground"
                            )}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", p.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                              {p.status}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {p.registered_date}
                            </div>
                          </div>
                          {canViewContact && (
                            <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <a href={`tel:${p.phone}`} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded" title="Call">
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                              <a href={`https://wa.me/${(p.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-emerald-600 transition-colors p-1 rounded" title="WhatsApp">
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                              <span className="text-xs text-muted-foreground ml-1 truncate">{p.phone}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

            ) : (

              /* ── Table View ── */
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="py-3 px-4 text-left font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">Patient</th>
                      <th className="py-3 px-4 text-left font-semibold text-muted-foreground text-[11px] uppercase tracking-wider hidden md:table-cell">ID</th>
                      {canViewContact && (
                        <>
                          <th className="py-3 px-4 text-left font-semibold text-muted-foreground text-[11px] uppercase tracking-wider hidden md:table-cell">Phone</th>
                          <th className="py-3 px-4 text-left font-semibold text-muted-foreground text-[11px] uppercase tracking-wider hidden lg:table-cell">Email</th>
                        </>
                      )}
                      <th className="py-3 px-4 text-left font-semibold text-muted-foreground text-[11px] uppercase tracking-wider hidden lg:table-cell">Registered</th>
                      <th className="py-3 px-4 text-left font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const initials = `${p.first_name[0]}${p.last_name[0]}`.toUpperCase();
                      return (
                        <motion.tr
                          key={p.id}
                          className={cn(
                            "border-b border-border/30 last:border-0 hover:bg-muted/30 transition-all duration-150 cursor-pointer group",
                            i % 2 === 0 ? "bg-card" : "bg-muted/10"
                          )}
                          onClick={() => navigate(`${basePath}/patients/${p.id}`)}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 ring-1 ring-border/30">
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                                  {p.first_name} {p.last_name}
                                </p>
                                {canViewContact && (
                                  <p className="text-[10px] text-muted-foreground md:hidden">{p.phone}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell text-muted-foreground font-mono text-xs">{p.id.slice(0, 8)}</td>
                          {canViewContact && (
                            <>
                              <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-sm" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                  <span>{p.phone}</span>
                                  <a href={`tel:${p.phone}`} title="Call" className="text-muted-foreground hover:text-primary transition-colors">
                                    <Phone className="h-3.5 w-3.5" />
                                  </a>
                                  <a href={`https://wa.me/${(p.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-muted-foreground hover:text-emerald-600 transition-colors">
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </a>
                                </div>
                              </td>
                              <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground text-sm">{p.email}</td>
                            </>
                          )}
                          <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground font-mono text-xs">{p.registered_date}</td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                              p.status === "active"
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-muted text-muted-foreground"
                            )}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", p.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 shadow-lg border-border/60">
                                <DropdownMenuItem onClick={() => navigate(`${basePath}/patients/${p.id}`)}>View Profile</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedPatientId(p.id); setBookOpen(true); }}>Book Appointment</DropdownMenuItem>
                                {canViewContact && (
                                  <>
                                    <DropdownMenuItem asChild>
                                      <a href={`tel:${p.phone}`}><Phone className="mr-2 h-3.5 w-3.5" />Call Patient</a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <a href={`https://wa.me/${(p.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="mr-2 h-3.5 w-3.5" />WhatsApp
                                      </a>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <AddPatientDialog open={addOpen} onOpenChange={setAddOpen} />
      <BookAppointmentDialog open={bookOpen} onOpenChange={setBookOpen} preselectedPatientId={selectedPatientId} />
    </div>
  );
}
