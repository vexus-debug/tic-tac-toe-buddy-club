import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

export interface AutomationWorkflow {
  id: string;
  org_id: string;
  workflow_type: string;
  trigger_event: string | null;
  name: string;
  description: string | null;
  is_enabled: boolean;
  message_template: string;
  timing_value: number;
  timing_unit: string;
  channel: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  org_id: string;
  workflow_id: string | null;
  patient_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  channel: string;
  status: string;
  message: string | null;
  error_message: string | null;
  sent_at: string;
}

const WORKFLOW_PRESETS: Omit<AutomationWorkflow, "id" | "org_id" | "created_at" | "updated_at">[] = [
  {
    workflow_type: "appointment_reminder",
    trigger_event: null,
    name: "Appointment Reminder",
    description: "Send reminders before upcoming appointments",
    is_enabled: true,
    message_template: "Reminder: {patient_name} has an appointment on {date} at {time}",
    timing_value: 1,
    timing_unit: "days",
    channel: "in_app",
  },
  {
    workflow_type: "recall",
    trigger_event: null,
    name: "Recall Reminder",
    description: "Remind patients who haven't visited in a while to schedule a checkup",
    is_enabled: false,
    message_template: "It's been a while since {patient_name}'s last visit. Time for a checkup!",
    timing_value: 6,
    timing_unit: "months",
    channel: "in_app",
  },
  {
    workflow_type: "missed_appointment",
    trigger_event: null,
    name: "Missed Appointment Follow-up",
    description: "Auto-follow-up after no-shows or cancellations",
    is_enabled: false,
    message_template: "{patient_name} missed their appointment yesterday. Follow up to reschedule.",
    timing_value: 1,
    timing_unit: "days",
    channel: "in_app",
  },
  {
    workflow_type: "invoice_alert",
    trigger_event: null,
    name: "Overdue Invoice Alert",
    description: "Notify when invoices are overdue",
    is_enabled: false,
    message_template: "Invoice {invoice_number} for {patient_name} (₦{amount}) is overdue.",
    timing_value: 1,
    timing_unit: "days",
    channel: "in_app",
  },
  {
    workflow_type: "treatment_followup",
    trigger_event: null,
    name: "Treatment Follow-up",
    description: "Post-treatment check-in messages",
    is_enabled: false,
    message_template: "Follow up with {patient_name} about their recent treatment.",
    timing_value: 3,
    timing_unit: "days",
    channel: "in_app",
  },
  {
    workflow_type: "event_triggered",
    trigger_event: "new_patient",
    name: "New Patient Welcome",
    description: "Notify when a new patient is registered",
    is_enabled: false,
    message_template: "Welcome! A new patient {patient_name} has been registered.",
    timing_value: 0,
    timing_unit: "hours",
    channel: "in_app",
  },
  {
    workflow_type: "event_triggered",
    trigger_event: "payment_received",
    name: "Payment Receipt",
    description: "Notify when a payment is received",
    is_enabled: false,
    message_template: "Payment of ₦{amount} received from {patient_name}.",
    timing_value: 0,
    timing_unit: "hours",
    channel: "in_app",
  },
];

export function useAutomationWorkflows() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["automation-workflows", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("automation_workflows")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as AutomationWorkflow[];
    },
  });
}

export function useInitializeWorkflows() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      const rows = WORKFLOW_PRESETS.map((p) => ({ ...p, org_id: orgId }));
      const { error } = await (supabase as any)
        .from("automation_workflows")
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation-workflows", orgId] });
      toast({ title: "Workflows initialized" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateWorkflow() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (update: Partial<AutomationWorkflow> & { id: string }) => {
      const { id, ...rest } = update;
      const { error } = await (supabase as any)
        .from("automation_workflows")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation-workflows", orgId] });
      toast({ title: "Workflow updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useAutomationLogs() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["automation-logs", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("automation_logs")
        .select("*")
        .eq("org_id", orgId)
        .order("sent_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as AutomationLog[];
    },
  });
}
