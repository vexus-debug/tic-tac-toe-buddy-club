import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { INTAKE_ALLERGIES, MEDICAL_ALERTS, detectMedicalAlerts, parseList, toggleAlertInHistory } from "@/lib/medicalSafety";

/** Structured one-tap allergy + medical-risk tags that write into the existing text fields. */
export function MedicalChecklist({ allergies, medicalHistory, onAllergiesChange, onHistoryChange }: {
  allergies: string;
  medicalHistory: string;
  onAllergiesChange: (v: string) => void;
  onHistoryChange: (v: string) => void;
}) {
  const list = parseList(allergies);
  const lower = list.map((a) => a.toLowerCase());
  const alerts = detectMedicalAlerts(medicalHistory);

  const toggleAllergy = (a: string) => {
    const on = lower.includes(a.toLowerCase());
    onAllergiesChange((on ? list.filter((x) => x.toLowerCase() !== a.toLowerCase()) : [...list, a]).join(", "));
  };

  const chip = (label: string, on: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        on ? "border-destructive bg-destructive text-destructive-foreground" : "border-border bg-background text-foreground hover:bg-muted",
      )}
    >
      {on && <Check className="h-3 w-3" />} {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Allergies</p>
        <div className="flex flex-wrap gap-1.5">
          {INTAKE_ALLERGIES.map((a) => chip(a, lower.includes(a.toLowerCase()), () => toggleAllergy(a)))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medical alerts</p>
        <div className="flex flex-wrap gap-1.5">
          {MEDICAL_ALERTS.map((a) => chip(a, alerts.includes(a), () => onHistoryChange(toggleAlertInHistory(medicalHistory, a))))}
        </div>
      </div>
    </div>
  );
}
