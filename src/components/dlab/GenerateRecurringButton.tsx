import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";
import type { LabRecord } from "@/hooks/useLabRecords";
import { dueOrders, nextDueAfter } from "@/lib/labRecurring";
import { turnaroundFor, addWorkingDaysYmd } from "@/lib/labCalendar";
import { useLabWorkCalendar } from "@/hooks/useLabWorkCalendar";

/** Creates a Case Board case for every active recurring order that is due, then rolls its next due date forward. */
export function GenerateRecurringButton({ orders }: { orders: LabRecord[] }) {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { cal } = useLabWorkCalendar();
  const due = dueOrders(orders as any[]);

  const run = async () => {
    if (!due.length || !currentOrg?.org_id) return;
    setBusy(true);
    let made = 0;
    const failed: string[] = [];
    for (const o of due) {
      const d = o.data || {};
      const { error } = await (supabase as any).from("lab_cases").insert({
        org_id: currentOrg.org_id, client_type: "external", status: "pending", qc_status: "pending",
        external_client_name: d.client || o.title, work_type: d.work_type || "Other",
        instructions: [`Recurring order: ${o.title}`, d.notes].filter(Boolean).join("\n"),
        due_date: addWorkingDaysYmd(new Date(), turnaroundFor(d.work_type), cal),
        lab_fee: Number(o.amount || 0), urgency: "normal", is_urgent: false,
      });
      if (error) { failed.push(o.title); continue; }
      const next = nextDueAfter(o.record_date!, d.frequency);
      await (supabase as any).from("lab_records").update({ record_date: next, data: { ...d, last_generated: new Date().toISOString().slice(0, 10) } }).eq("id", o.id);
      made++;
    }
    setBusy(false);
    qc.invalidateQueries({ queryKey: ["lab_cases"] });
    qc.invalidateQueries({ queryKey: ["lab_records"] });
    toast({
      title: made ? `${made} case${made === 1 ? "" : "s"} added to the Case Board` : "No cases created",
      description: failed.length ? `Could not create: ${failed.join(", ")}` : undefined,
      variant: failed.length && !made ? "destructive" : undefined,
    });
  };

  return (
    <Button variant="outline" onClick={run} disabled={busy || !due.length}>
      <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      Generate due cases{due.length ? ` (${due.length})` : ""}
    </Button>
  );
}
