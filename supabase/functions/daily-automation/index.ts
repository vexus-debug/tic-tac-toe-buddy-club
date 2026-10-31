import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const results: Record<string, any> = {};

  try {
    // Fetch all enabled workflows across all orgs
    const { data: workflows, error: wfErr } = await supabase
      .from("automation_workflows")
      .select("*")
      .eq("is_enabled", true);

    if (wfErr) throw wfErr;
    if (!workflows || workflows.length === 0) {
      return new Response(JSON.stringify({ message: "No active workflows" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group workflows by type
    const byType: Record<string, typeof workflows> = {};
    for (const wf of workflows) {
      if (!byType[wf.workflow_type]) byType[wf.workflow_type] = [];
      byType[wf.workflow_type].push(wf);
    }

    // 1. APPOINTMENT REMINDERS
    if (byType["appointment_reminder"]) {
      results.appointment_reminders = await processAppointmentReminders(
        supabase,
        byType["appointment_reminder"]
      );
    }

    // 2. RECALL SYSTEM
    if (byType["recall"]) {
      results.recalls = await processRecalls(supabase, byType["recall"]);
    }

    // 3. MISSED APPOINTMENT RECOVERY
    if (byType["missed_appointment"]) {
      results.missed_appointments = await processMissedAppointments(
        supabase,
        byType["missed_appointment"]
      );
    }

    // 4. INVOICE/PAYMENT ALERTS
    if (byType["invoice_alert"]) {
      results.invoice_alerts = await processInvoiceAlerts(
        supabase,
        byType["invoice_alert"]
      );
    }

    // 5. TREATMENT FOLLOW-UP
    if (byType["treatment_followup"]) {
      results.treatment_followups = await processTreatmentFollowups(
        supabase,
        byType["treatment_followup"]
      );
    }

    // 6. EVENT-TRIGGERED (new_patient welcome etc.) — handled via DB triggers or realtime, not cron
    // Skipped in daily cron

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Daily automation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── APPOINTMENT REMINDERS ──────────────────────────────────────────
async function processAppointmentReminders(supabase: any, workflows: any[]) {
  let sent = 0;
  for (const wf of workflows) {
    const orgId = wf.org_id;
    // Calculate the target date based on timing (e.g. 24 hours = tomorrow, 1 day = tomorrow)
    const hoursAhead =
      wf.timing_unit === "days"
        ? wf.timing_value * 24
        : wf.timing_unit === "hours"
        ? wf.timing_value
        : wf.timing_value * 24;

    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + hoursAhead);
    const dateStr = targetDate.toISOString().split("T")[0];

    // Find appointments for that date
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, patient_id, appointment_date, appointment_time, patients(first_name, last_name)")
      .eq("org_id", orgId)
      .eq("appointment_date", dateStr)
      .eq("status", "scheduled");

    if (!appointments || appointments.length === 0) continue;

    // Check which ones already got a reminder
    const appointmentIds = appointments.map((a: any) => a.id);
    const { data: existingLogs } = await supabase
      .from("automation_logs")
      .select("entity_id")
      .eq("workflow_id", wf.id)
      .in("entity_id", appointmentIds);

    const alreadySent = new Set((existingLogs || []).map((l: any) => l.entity_id));

    for (const appt of appointments) {
      if (alreadySent.has(appt.id)) continue;

      const patientName = appt.patients
        ? `${appt.patients.first_name} ${appt.patients.last_name}`
        : "Patient";

      const message = (wf.message_template || "You have an upcoming appointment on {date} at {time}")
        .replace("{date}", appt.appointment_date)
        .replace("{time}", appt.appointment_time)
        .replace("{patient_name}", patientName);

      // Create in-app notification
      // We need the patient's user_id — but patients may not have user accounts.
      // So we create a notification for all org admins/staff instead, and log it.
      await createStaffNotification(supabase, orgId, `Reminder: ${patientName}`, message, `/appointments`);

      // Log
      await supabase.from("automation_logs").insert({
        org_id: orgId,
        workflow_id: wf.id,
        patient_id: appt.patient_id,
        entity_type: "appointment",
        entity_id: appt.id,
        channel: "in_app",
        status: "sent",
        message,
      });

      sent++;
    }
  }
  return { sent };
}

// ─── RECALL SYSTEM ──────────────────────────────────────────────────
async function processRecalls(supabase: any, workflows: any[]) {
  let sent = 0;
  for (const wf of workflows) {
    const orgId = wf.org_id;
    // Find patients whose last appointment was X months ago
    const monthsAgo = wf.timing_unit === "months" ? wf.timing_value : wf.timing_value;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    // Patients with last completed appointment before cutoff
    const { data: patients } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("org_id", orgId)
      .eq("status", "active");

    if (!patients || patients.length === 0) continue;

    for (const patient of patients) {
      // Check last completed appointment
      const { data: lastAppt } = await supabase
        .from("appointments")
        .select("appointment_date")
        .eq("patient_id", patient.id)
        .eq("status", "completed")
        .order("appointment_date", { ascending: false })
        .limit(1);

      if (!lastAppt || lastAppt.length === 0) continue;
      if (lastAppt[0].appointment_date > cutoffStr) continue;

      // Check if already sent recall for this patient recently (within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: recentLog } = await supabase
        .from("automation_logs")
        .select("id")
        .eq("workflow_id", wf.id)
        .eq("patient_id", patient.id)
        .gte("sent_at", thirtyDaysAgo.toISOString())
        .limit(1);

      if (recentLog && recentLog.length > 0) continue;

      const patientName = `${patient.first_name} ${patient.last_name}`;
      const message = (wf.message_template || "It's been a while since {patient_name}'s last visit. Time for a checkup!")
        .replace("{patient_name}", patientName);

      await createStaffNotification(supabase, orgId, `Recall: ${patientName}`, message, `/patients`);

      await supabase.from("automation_logs").insert({
        org_id: orgId,
        workflow_id: wf.id,
        patient_id: patient.id,
        entity_type: "patient",
        entity_id: patient.id,
        channel: "in_app",
        status: "sent",
        message,
      });

      sent++;
    }
  }
  return { sent };
}

// ─── MISSED APPOINTMENT RECOVERY ────────────────────────────────────
async function processMissedAppointments(supabase: any, workflows: any[]) {
  let sent = 0;
  for (const wf of workflows) {
    const orgId = wf.org_id;
    // Find cancelled/no-show appointments from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: missed } = await supabase
      .from("appointments")
      .select("id, patient_id, patients(first_name, last_name)")
      .eq("org_id", orgId)
      .eq("appointment_date", yesterdayStr)
      .in("status", ["cancelled", "no-show"]);

    if (!missed || missed.length === 0) continue;

    const missedIds = missed.map((m: any) => m.id);
    const { data: existingLogs } = await supabase
      .from("automation_logs")
      .select("entity_id")
      .eq("workflow_id", wf.id)
      .in("entity_id", missedIds);

    const alreadySent = new Set((existingLogs || []).map((l: any) => l.entity_id));

    for (const appt of missed) {
      if (alreadySent.has(appt.id)) continue;

      const patientName = appt.patients
        ? `${appt.patients.first_name} ${appt.patients.last_name}`
        : "Patient";

      const message = (wf.message_template || "{patient_name} missed their appointment yesterday. Follow up to reschedule.")
        .replace("{patient_name}", patientName);

      await createStaffNotification(supabase, orgId, `Missed: ${patientName}`, message, `/appointments`);

      await supabase.from("automation_logs").insert({
        org_id: orgId,
        workflow_id: wf.id,
        patient_id: appt.patient_id,
        entity_type: "appointment",
        entity_id: appt.id,
        channel: "in_app",
        status: "sent",
        message,
      });

      sent++;
    }
  }
  return { sent };
}

// ─── INVOICE ALERTS ─────────────────────────────────────────────────
async function processInvoiceAlerts(supabase: any, workflows: any[]) {
  let sent = 0;
  for (const wf of workflows) {
    const orgId = wf.org_id;
    const today = new Date().toISOString().split("T")[0];

    // Find overdue invoices
    const { data: overdueInvoices } = await supabase
      .from("invoices")
      .select("id, invoice_number, patient_id, total, due_date, patients(first_name, last_name)")
      .eq("org_id", orgId)
      .eq("status", "sent")
      .lt("due_date", today);

    if (!overdueInvoices || overdueInvoices.length === 0) continue;

    const invoiceIds = overdueInvoices.map((i: any) => i.id);
    const { data: existingLogs } = await supabase
      .from("automation_logs")
      .select("entity_id")
      .eq("workflow_id", wf.id)
      .in("entity_id", invoiceIds)
      .gte("sent_at", new Date(Date.now() - 7 * 86400000).toISOString()); // don't repeat within 7 days

    const alreadySent = new Set((existingLogs || []).map((l: any) => l.entity_id));

    for (const inv of overdueInvoices) {
      if (alreadySent.has(inv.id)) continue;

      const patientName = inv.patients
        ? `${inv.patients.first_name} ${inv.patients.last_name}`
        : "Patient";

      const message = (wf.message_template || "Invoice {invoice_number} for {patient_name} (₦{amount}) is overdue.")
        .replace("{invoice_number}", inv.invoice_number)
        .replace("{patient_name}", patientName)
        .replace("{amount}", Number(inv.total).toLocaleString());

      await createStaffNotification(supabase, orgId, `Overdue: ${inv.invoice_number}`, message, `/billing`);

      await supabase.from("automation_logs").insert({
        org_id: orgId,
        workflow_id: wf.id,
        patient_id: inv.patient_id,
        entity_type: "invoice",
        entity_id: inv.id,
        channel: "in_app",
        status: "sent",
        message,
      });

      sent++;
    }
  }
  return { sent };
}

// ─── TREATMENT FOLLOW-UP ────────────────────────────────────────────
async function processTreatmentFollowups(supabase: any, workflows: any[]) {
  let sent = 0;
  for (const wf of workflows) {
    const orgId = wf.org_id;
    // Find completed appointments from X days ago
    const daysAgo = wf.timing_unit === "days" ? wf.timing_value : wf.timing_value;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const targetStr = targetDate.toISOString().split("T")[0];

    const { data: completedAppts } = await supabase
      .from("appointments")
      .select("id, patient_id, patients(first_name, last_name)")
      .eq("org_id", orgId)
      .eq("status", "completed")
      .eq("appointment_date", targetStr);

    if (!completedAppts || completedAppts.length === 0) continue;

    const apptIds = completedAppts.map((a: any) => a.id);
    const { data: existingLogs } = await supabase
      .from("automation_logs")
      .select("entity_id")
      .eq("workflow_id", wf.id)
      .in("entity_id", apptIds);

    const alreadySent = new Set((existingLogs || []).map((l: any) => l.entity_id));

    for (const appt of completedAppts) {
      if (alreadySent.has(appt.id)) continue;

      const patientName = appt.patients
        ? `${appt.patients.first_name} ${appt.patients.last_name}`
        : "Patient";

      const message = (wf.message_template || "Follow up with {patient_name} about their recent treatment.")
        .replace("{patient_name}", patientName);

      await createStaffNotification(supabase, orgId, `Follow-up: ${patientName}`, message, `/patients`);

      await supabase.from("automation_logs").insert({
        org_id: orgId,
        workflow_id: wf.id,
        patient_id: appt.patient_id,
        entity_type: "appointment",
        entity_id: appt.id,
        channel: "in_app",
        status: "sent",
        message,
      });

      sent++;
    }
  }
  return { sent };
}

// ─── HELPER: Create notification for all org owners/admins ──────────
async function createStaffNotification(
  supabase: any,
  orgId: string,
  title: string,
  message: string,
  link: string
) {
  // Get all org members (owners + admins)
  const { data: members } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .in("role", ["owner", "admin"]);

  if (!members || members.length === 0) return;

  const notifications = members.map((m: any) => ({
    org_id: orgId,
    user_id: m.user_id,
    type: "automation",
    title,
    message,
    link,
    is_read: false,
  }));

  await supabase.from("notifications").insert(notifications);
}
