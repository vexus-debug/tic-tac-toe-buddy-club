import { useState } from "react";
import { AlertTriangle, ChevronDown, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALERT_GUIDANCE, detectMedicalAlerts, parseList } from "@/lib/medicalSafety";

/** Always-visible allergy + medical alert strip on the patient record. */
export function PatientAlertBanner({ allergies, medicalHistory, onEdit }: { allergies?: string | null; medicalHistory?: string | null; onEdit?: () => void }) {
  const [open, setOpen] = useState(false);
  const list = parseList(allergies);
  const alerts = detectMedicalAlerts(medicalHistory);
  if (!list.length && !alerts.length) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        <HeartPulse className="h-3.5 w-3.5" /> No allergies or medical alerts recorded.
        {onEdit && <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onEdit}>Record now</Button>}
      </div>
    );
  }
  return (
    <div role="alert" className="sticky top-0 z-20 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
        {list.length > 0 && (
          <>
            <span className="text-xs font-semibold uppercase tracking-wide text-destructive">Allergies</span>
            {list.map((a) => (
              <span key={a} className="rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">{a}</span>
            ))}
          </>
        )}
        {alerts.length > 0 && (
          <>
            <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-foreground">Alerts</span>
            {alerts.map((a) => (
              <span key={a} className="rounded-full border border-destructive/40 bg-background px-2 py-0.5 text-xs font-medium text-foreground">{a}</span>
            ))}
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          {alerts.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              Details <ChevronDown className={cn("ml-1 h-3 w-3 transition-transform", open && "rotate-180")} />
            </Button>
          )}
          {onEdit && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onEdit}>Update medical alerts</Button>}
        </div>
      </div>
      {open && alerts.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-destructive/20 pt-2 text-xs">
          {alerts.map((a) => (
            <li key={a}><span className="font-semibold">{a}:</span> <span className="text-muted-foreground">{ALERT_GUIDANCE[a]}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}
