import { useState, useEffect } from "react";
import { usePatientContext } from "@/hooks/usePatientContext";
import { PatientVisitBar } from "@/components/dashboard/PatientVisitBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FlaskConical, MessageCircle, Mail, Share2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { CreateLabCaseDialog } from "@/components/dashboard/CreateLabCaseDialog";
import { useLabOrders } from "@/hooks/useLabOrders";
import { useLabCases } from "@/hooks/useLabCases";
import { LabCaseDetailDialog } from "@/components/dashboard/LabCaseDetailDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "in-progress": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const statusDots: Record<string, string> = {
  pending: "bg-muted-foreground/50",
  sent: "bg-blue-500",
  "in-progress": "bg-amber-500",
  completed: "bg-emerald-500",
};

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
};

export default function LabWorkPage() {
  const [labOpen, setLabOpen] = useState(false);
  const { patientId, searchParams, consumeFlag } = usePatientContext();
  const [prefill] = useState(() => ({ tooth: searchParams.get("tooth") || undefined, shade: searchParams.get("shade") || undefined, work: searchParams.get("work") || undefined }));
  useEffect(() => { if (consumeFlag("new")) setLabOpen(true); }, [consumeFlag]);
  const { data: labOrders = [], isLoading } = useLabOrders();
  // Deep-link from a patient's lab case card: ?caseId=... opens that ticket.
  const [caseId, setCaseId] = useState<string | null>(() => searchParams.get("caseId"));
  const { data: labCases = [] } = useLabCases();
  const linkedCase = caseId ? labCases.find((c) => c.id === caseId) || null : null;

  const statuses = ["pending", "sent", "in-progress", "completed"] as const;

  return (
    <div className="space-y-6">
      {patientId && <PatientVisitBar patientId={patientId} />}
      <PageHeader
        title="Lab Work"
        description="Track dental lab orders and results"
        tutorial={{
          title: "Lab Work — How to Use",
          description: "Create and track lab orders sent to external dental laboratories for prosthetics, orthodontics, and more.",
          steps: [
            {
              title: "View all lab orders",
              description: "The table shows all lab orders with patient name, lab name, work type, due date, and current status. Orders are sorted by creation date (newest first).",
            },
            {
              title: "Create a new lab order",
              description: "Click 'New Lab Case'. Select the patient, assign the dentist, choose the lab work type (Crown, Bridge, Denture, etc.), and pick the laboratory.",
              tip: "Fill in the due date carefully — labs need adequate lead time, typically 5–14 days for most prosthetic work.",
            },
            {
              title: "Add lab specifications",
              description: "In the order form, add shade/color requirements, material preferences (ceramic, zirconia, metal, etc.), and any special instructions. Clear instructions reduce lab errors and remakes.",
            },
            {
              title: "Track order statuses",
              description: "Orders progress through: Pending → Sent → In Progress → Completed → Received. Update the status as each stage is reached so the team knows what to expect.",
            },
            {
              title: "Mark as received",
              description: "When the lab work arrives at the clinic, update the status to 'Received' and record the received date. This triggers a reminder to schedule the patient for fitting.",
            },
          ],
          nextPageHint: {
            label: "Appointments",
            description: "Once lab work is received, book the patient's fitting/delivery appointment on the Appointments page.",
          },
        }}
      >
        <Button size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => setLabOpen(true)} data-tour="lab-work-new">
          <Plus className="mr-2 h-4 w-4" />
          New Lab Case
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-card"><CardContent className="p-5 space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-20 w-full rounded-lg" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" variants={stagger.container} initial="hidden" animate="visible" data-tour="lab-work-board">
          {statuses.map((status) => {
            const orders = labOrders.filter((o) => o.status === status);
            return (
              <motion.div key={status} variants={stagger.item}>
                <Card className="glass-card">
                  <CardHeader className="pb-2 border-b border-border/30" data-tour={`lab-work-column-${status}`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm capitalize">{status.replace("-", " ")}</CardTitle>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDots[status]}`} />
                        {orders.length}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-3">
                    {orders.map((order) => {
                      const patientName = order.patients ? `${order.patients.first_name} ${order.patients.last_name}` : "Unknown";
                      const orderSummary = `Lab Order: ${order.lab_work_type}\nPatient: ${patientName}\nLab: ${order.lab_name}${order.due_date ? `\nDue: ${order.due_date}` : ""}${order.notes ? `\nNotes: ${order.notes}` : ""}`;
                      const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(orderSummary)}`;
                      const emailUrl = `mailto:?subject=${encodeURIComponent(`Lab Order - ${order.lab_work_type} for ${patientName}`)}&body=${encodeURIComponent(orderSummary)}`;
                      return (
                      <div key={order.id} className="p-3 rounded-lg border border-border/30 bg-card/50 hover:shadow-md hover:border-secondary/20 transition-all duration-200 group cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium group-hover:text-secondary transition-colors">{order.lab_work_type}</p>
                            <p className="text-xs text-muted-foreground mt-1">{patientName}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" data-tour="lab-work-share">
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
                                  <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" /> Send via WhatsApp
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={emailUrl}>
                                  <Mail className="mr-2 h-4 w-4 text-primary" /> Send via Email
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-border/20">
                          <span className="text-[10px] text-muted-foreground font-mono">{order.lab_name}</span>
                          {order.due_date && <span className="text-[10px] text-muted-foreground font-mono">Due: {order.due_date}</span>}
                        </div>
                      </div>
                    );
                    })}
                    {orders.length === 0 && (
                      <div className="flex flex-col items-center py-6">
                        <FlaskConical className="h-6 w-6 text-muted-foreground/30 mb-1.5" />
                        <p className="text-xs text-muted-foreground">No orders</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
      <LabCaseDetailDialog labCase={linkedCase} open={!!linkedCase} onOpenChange={(o) => !o && setCaseId(null)} />
      <CreateLabCaseDialog open={labOpen} onOpenChange={setLabOpen} preselectedPatientId={patientId || undefined} preselectedTooth={prefill.tooth} preselectedShade={prefill.shade} preselectedWork={prefill.work} />
    </div>
  );
}