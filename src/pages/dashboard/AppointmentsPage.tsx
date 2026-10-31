// @ts-nocheck
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarPlus, ChevronLeft, ChevronRight, CalendarIcon, UserPlus, CalendarDays } from "lucide-react";
import { addDays, subDays, format, startOfWeek, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { BookAppointmentDialog } from "@/components/dashboard/BookAppointmentDialog";
import { AppointmentDetailDialog } from "@/components/dashboard/AppointmentDetailDialog";
import { WalkInDialog } from "@/components/dashboard/WalkInDialog";
import { cn } from "@/lib/utils";
import { useAppointmentsByDate, type AppointmentRow } from "@/hooks/useAppointments";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useDentists } from "@/hooks/useStaff";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useClinicTerms } from "@/hooks/useClinicTerms";
import { useWaitingList } from "@/hooks/useWaitingList";
import { useCheckInAppointment } from "@/hooks/useVisitFlow";
import { ProviderBadge } from "@/components/dashboard/associate/ProviderBadge";

const defaultChairs = ["Chair 1", "Chair 2", "Chair 3"];
const defaultSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"];

/** Normalise any stored time ("09:00:00", "9:00 AM", "09:00") to "HH:mm". */
function toHHmm(raw?: string | null): string {
  if (!raw) return "";
  const s = raw.trim();
  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp])[Mm]?$/);
  if (ampm) {
    let h = parseInt(ampm[1], 10) % 12;
    if (ampm[3].toLowerCase() === "p") h += 12;
    return `${String(h).padStart(2, "0")}:${ampm[2]}`;
  }
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : s;
}

function label12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${String(hr).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  "in-progress": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const statusDots: Record<string, string> = {
  scheduled: "bg-blue-500",
  "in-progress": "bg-amber-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

function useMonthAppointments(month: Date) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["month-appointments", orgId, monthStart],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, staff_id, appointment_date, appointment_time, status, patients(first_name, last_name), staff(full_name), treatments(name)")
        .eq("org_id", orgId!)
        .gte("appointment_date", monthStart)
        .lte("appointment_date", monthEnd)
        .order("appointment_time");
      return data || [];
    },
  });
}

export default function AppointmentsPage() {
  const terms = useClinicTerms();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookOpen, setBookOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRow | null>(null);

  const { data: allAppointments = [], isLoading } = useAppointmentsByDate(currentDate);
  const { user } = useAuth();
  const { data: dentistList = [] } = useDentists();
  const myStaffId = dentistList.find((d: any) => d.user_id && d.user_id === user?.id)?.id as string | undefined;
  const [scope, setScope] = useState<"mine" | "all" | null>(null);
  // Dentists land on their own schedule; everyone else sees all chairs.
  const { currentOrg } = useOrg();
  const isDentistRole = currentOrg?.role === "dentist";
  const effectiveScope = isDentistRole ? "mine" : scope ?? (myStaffId ? "mine" : "all");
  const onlyMine = effectiveScope === "mine" && (!!myStaffId || isDentistRole);
  const appointments = onlyMine ? allAppointments.filter((a) => !!myStaffId && a.staff_id === myStaffId) : allAppointments;
  const { data: waitingList = [] } = useWaitingList();
  const addToQueue = useCheckInAppointment();
  const queuedAppointmentIds = new Set(waitingList.map((w) => w.appointment_id).filter(Boolean) as string[]);
  const { data: allMonthAppointments = [] } = useMonthAppointments(currentDate);
  const monthAppointments = onlyMine ? allMonthAppointments.filter((a: any) => !!myStaffId && a.staff_id === myStaffId) : allMonthAppointments;

  const displayAppointments = appointments.map((a) => ({
    ...a,
    patientName: a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : "Unknown",
    dentist: a.staff?.full_name || "Unknown",
    providerType: (dentistList.find((d: any) => d.id === a.staff_id) as any)?.provider_type,
    time: toHHmm(a.appointment_time),
    treatment: a.treatments?.name || "N/A",
  }));

  // Columns / rows derived from actual data so nothing is hidden by hardcoded lists
  const chairs = Array.from(new Set([...defaultChairs, ...displayAppointments.map((a) => a.chair || "Unassigned")]));
  const timeSlots = Array.from(new Set([...defaultSlots, ...displayAppointments.map((a) => a.time).filter(Boolean)])).sort();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Month view data
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = (getDay(monthStart) + 6) % 7; // Monday = 0
  const paddedDays = Array.from({ length: startPadding }, () => null).concat(monthDays);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, typeof monthAppointments> = {};
    monthAppointments.forEach((a: any) => {
      if (!map[a.appointment_date]) map[a.appointment_date] = [];
      map[a.appointment_date].push(a);
    });
    return map;
  }, [monthAppointments]);

  const handleNav = () => {
    if (viewMode === "day") return { prev: () => setCurrentDate(subDays(currentDate, 1)), next: () => setCurrentDate(addDays(currentDate, 1)) };
    if (viewMode === "week") return { prev: () => setCurrentDate(subWeeks(currentDate, 1)), next: () => setCurrentDate(addWeeks(currentDate, 1)) };
    return { prev: () => setCurrentDate(subMonths(currentDate, 1)), next: () => setCurrentDate(addMonths(currentDate, 1)) };
  };
  const nav = handleNav();

  const titleText = viewMode === "day"
    ? format(currentDate, "EEEE, MMMM d, yyyy")
    : viewMode === "week"
    ? `${format(weekStart, "MMM d")} — ${format(addDays(weekStart, 6), "MMM d, yyyy")}`
    : format(currentDate, "MMMM yyyy");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Manage and schedule patient visits"
        tutorial={{
          title: "Appointments — How to Use",
          description: "Schedule, manage, and track all patient appointments from this calendar.",
          steps: [
            {
              title: "Choose your view",
              description: "Switch between Day, Week, and Month views using the toggle buttons. Day view shows the chair-by-chair schedule for today. Week view shows the whole week. Month view gives an overview with appointment dots on each day.",
              tip: "Day view is best during clinic hours. Month view is great for planning ahead.",
            },
            {
              title: "Navigate dates",
              description: "Use the left/right arrows to move between days, weeks, or months. Click 'Today' to jump back to the current date. Use 'Jump to date' to pick a specific date from the calendar picker.",
            },
            {
              title: "Book an appointment",
              description: "Click 'Book Appointment' (top right). Select the patient, dentist, date, time, chair, and treatment type. Click 'Book' to confirm — it will appear immediately on the schedule.",
            },
            {
              title: "Handle walk-in patients",
              description: "Click 'Walk-In' to quickly register a patient who has arrived without a prior booking. The system will slot them into the next available chair and time.",
              tip: "Walk-ins are marked with a special badge so staff can prioritise booked patients.",
            },
            {
              title: "View or update an appointment",
              description: "Click on any appointment block in the calendar to open its detail view. You can update the status (Scheduled → In Progress → Completed), add notes, or cancel it.",
            },
            {
              title: "Understand appointment statuses",
              description: "Blue = Scheduled (upcoming), Amber = In Progress (patient is currently being seen), Green = Completed, Red = Cancelled. Update statuses in real time as patients move through their visit.",
            },
          ],
          nextPageHint: {
            label: "Billing & Payments",
            description: "After a patient's appointment is completed, create an invoice on the Billing page.",
          },
        }}
      >
        {myStaffId && !isDentistRole && (
          <div className="inline-flex rounded-md border border-border/50 p-0.5" role="group" aria-label="Whose appointments">
            <Button size="sm" variant={onlyMine ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setScope("mine")}>My appointments</Button>
            <Button size="sm" variant={!onlyMine ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setScope("all")}>All chairs</Button>
          </div>
        )}
        {!isDentistRole && (<>
        <Button size="sm" variant="outline" onClick={() => setWalkInOpen(true)} className="border-border/50">
          <UserPlus className="mr-2 h-4 w-4" />
          Walk-In
        </Button>
        <Button size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => setBookOpen(true)}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Book Appointment
        </Button>
        </>)}
      </PageHeader>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs defaultValue="schedule">
          <TabsList className="bg-muted/50 backdrop-blur-sm" data-tour="appointments-tabs">
            <TabsTrigger value="schedule">Schedule View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-4">
            <Card className="glass-card overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nav.prev} data-tour="appointments-nav">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-base">{titleText}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nav.next}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs border-border/50" onClick={() => setCurrentDate(new Date())}>Today</Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs border-border/50">
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                          Jump to date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 backdrop-blur-xl" align="start">
                        <Calendar mode="single" selected={currentDate} onSelect={(d) => d && setCurrentDate(d)} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <div className="flex border border-border/50 rounded-lg overflow-hidden" data-tour="appointments-view-toggle">
                      {(["day", "week", "month"] as const).map((mode) => (
                        <button key={mode} className={cn("px-3 py-1.5 text-xs font-medium transition-all capitalize", viewMode === mode ? "bg-secondary text-secondary-foreground" : "bg-muted/30 hover:bg-muted/60")} onClick={() => setViewMode(mode)}>
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2.5 hidden md:flex" data-tour="appointments-status-legend">
                    {Object.entries(statusColors).map(([status]) => (
                      <div key={status} className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${statusDots[status]}`} />
                        <span className="text-[10px] text-muted-foreground capitalize">{status.replace("-", " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto" data-tour="appointments-calendar">
                {isLoading && viewMode !== "month" ? (
                  <TableSkeleton columns={4} rows={8} />
                ) : viewMode === "day" ? (
                  displayAppointments.length === 0 ? (
                    <EmptyState icon={CalendarDays} title="No appointments" description="No appointments scheduled for this day." actionLabel="Book Appointment" onAction={() => setBookOpen(true)} />
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="py-3 px-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider w-24">Time</th>
                          {chairs.map((chair) => (
                            <th key={chair} className="py-3 px-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">{chair}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((time) => {
                          const appointmentsAtTime = displayAppointments.filter((a) => a.time === time);
                          return (
                            <tr key={time} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                              <td className="py-2 px-3 text-xs text-muted-foreground font-mono">{label12(time)}</td>
                              {chairs.map((chair) => {
                                const apt = appointmentsAtTime.find((a) => (a.chair || "Unassigned") === chair);
                                return (
                                  <td key={chair} className="py-1 px-2">
                                    {apt ? (
                                      <div className={`rounded-lg border p-2.5 text-xs cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${statusColors[apt.status] || ""}`} onClick={() => setSelectedAppointment(apt)}>
                                        <div className="flex items-center gap-2 mb-1">
                                          <Avatar className="h-5 w-5">
                                            <AvatarFallback className="text-[8px] bg-current/10">{apt.patientName.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
                                          </Avatar>
                                          <p className="font-medium truncate">{apt.patientName}</p>
                                        </div>
                                        <p className="opacity-75 truncate">{apt.treatment}</p>
                                        <p className="opacity-60 text-[10px] mt-0.5 flex items-center gap-1">{apt.dentist}<ProviderBadge compact type={apt.providerType} /></p>
                                        {!isDentistRole && apt.status === "scheduled" && isSameDay(currentDate, new Date()) && (
                                          queuedAppointmentIds.has(apt.id) ? (
                                            <p className="mt-1.5 text-[10px] font-semibold text-emerald-700">✓ Checked in</p>
                                          ) : (
                                            <button
                                              type="button"
                                              className="mt-1.5 w-full rounded-md bg-background/70 border border-current/20 px-2 py-1 text-[10px] font-semibold hover:bg-background"
                                              disabled={addToQueue.isPending}
                                              onClick={(e) => { e.stopPropagation(); addToQueue.mutate({ id: apt.id, patient_id: apt.patient_id, chair: apt.chair, notes: apt.notes }); }}
                                            >
                                              Check in
                                            </button>
                                          )
                                        )}
                                      </div>
                                    ) : null}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )
                ) : viewMode === "week" ? (
                  <div className="p-6 text-sm text-muted-foreground text-center">
                    <p className="mb-4">Select a day to view appointments</p>
                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map((day) => {
                        const isToday = isSameDay(day, new Date());
                        return (
                          <button key={day.toISOString()} className={cn("p-4 rounded-xl border border-border/40 text-center hover:bg-accent/40 cursor-pointer transition-all duration-200 hover:shadow-md", isToday && "bg-secondary/10 border-secondary/30 shadow-sm")} onClick={() => { setCurrentDate(day); setViewMode("day"); }}>
                            <div className="text-[10px] uppercase text-muted-foreground font-medium">{format(day, "EEE")}</div>
                            <div className="text-lg font-semibold mt-0.5">{format(day, "d")}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Month View */
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                        <div key={d} className="text-center text-[10px] font-medium text-muted-foreground uppercase py-2">{d}</div>
                      ))}
                      {paddedDays.map((day, i) => {
                        if (!day) return <div key={`pad-${i}`} className="min-h-[80px]" />;
                        const dateStr = format(day, "yyyy-MM-dd");
                        const dayAppts = appointmentsByDate[dateStr] || [];
                        const isToday = isSameDay(day, new Date());
                        const isSelected = isSameDay(day, currentDate);

                        return (
                          <button
                            key={dateStr}
                            className={cn(
                              "min-h-[80px] p-1.5 rounded-lg border border-border/30 text-left hover:bg-accent/30 transition-all cursor-pointer",
                              isToday && "bg-primary/5 border-primary/30",
                              isSelected && "ring-2 ring-primary/40"
                            )}
                            onClick={() => { setCurrentDate(day); setViewMode("day"); }}
                          >
                            <div className={cn("text-xs font-medium mb-1", isToday ? "text-primary font-bold" : "text-foreground")}>
                              {format(day, "d")}
                            </div>
                            {dayAppts.length > 0 && (
                              <div className="space-y-0.5">
                                {dayAppts.slice(0, 3).map((a: any) => (
                                  <div key={a.id} className={cn("text-[9px] px-1 py-0.5 rounded truncate", statusColors[a.status]?.replace(/border-\S+/g, "") || "bg-muted")}>
                                    {a.patients?.first_name || "Appt"}
                                  </div>
                                ))}
                                {dayAppts.length > 3 && (
                                  <div className="text-[9px] text-muted-foreground">+{dayAppts.length - 3} more</div>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-0">
                {isLoading ? (
                  <TableSkeleton columns={6} rows={6} />
                ) : displayAppointments.length === 0 ? (
                  <EmptyState icon={CalendarDays} title="No appointments" description="No appointments scheduled for this day." />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Time</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Patient</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">{terms.clinician}</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Chair</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Treatment</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Arrival</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayAppointments.map((apt, i) => {
                        const initials = apt.patientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                        return (
                          <motion.tr key={apt.id} className="border-b border-border/30 last:border-0 hover:bg-accent/30 cursor-pointer transition-all group" onClick={() => setSelectedAppointment(apt)} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                            <td className="py-3 px-4 font-mono text-xs">{label12(apt.time)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="bg-secondary/10 text-secondary text-[10px] font-semibold">{initials}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium group-hover:text-secondary transition-colors">{apt.patientName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell text-muted-foreground"><span className="flex items-center gap-2">{apt.dentist}<ProviderBadge type={apt.providerType} /></span></td>
                            <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{apt.chair}</td>
                            <td className="py-3 px-4 text-muted-foreground">{apt.treatment}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${(statusColors[apt.status] || "").replace(/border-\S+/g, "")}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${statusDots[apt.status] || ""}`} />
                                {apt.status.replace("-", " ")}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              {queuedAppointmentIds.has(apt.id) ? (
                                <span className="text-[11px] text-emerald-600 font-medium">Checked in</span>
                              ) : isDentistRole ? null : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px]"
                                  disabled={addToQueue.isPending || apt.status === "cancelled"}
                                  onClick={() => addToQueue.mutate({ id: apt.id, patient_id: apt.patient_id, chair: apt.chair, notes: apt.notes })}
                                >
                                  Check in
                                </Button>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      <BookAppointmentDialog open={bookOpen} onOpenChange={setBookOpen} />
      <WalkInDialog open={walkInOpen} onOpenChange={setWalkInOpen} />
      <AppointmentDetailDialog appointment={selectedAppointment} open={!!selectedAppointment} onOpenChange={(o) => !o && setSelectedAppointment(null)} checkedIn={!!selectedAppointment && queuedAppointmentIds.has(selectedAppointment.id)} />
    </div>
  );
}
