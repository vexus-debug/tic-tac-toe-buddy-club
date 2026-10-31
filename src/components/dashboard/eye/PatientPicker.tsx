import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEyePatients } from "@/hooks/eye/useEye";
import { Check } from "lucide-react";

interface Props {
  value?: string | null;
  onChange: (patientId: string) => void;
  label?: string;
}

export function PatientPicker({ value, onChange, label = "Patient" }: Props) {
  const [term, setTerm] = useState("");
  const { data: patients = [] } = useEyePatients(term);
  const selected = patients.find((p: any) => p.id === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        placeholder="Search patient by name or phone…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {selected && (
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{selected.first_name} {selected.last_name}</span>
        </p>
      )}
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border/40 p-1">
        {patients.slice(0, 40).map((p: any) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${
              p.id === value ? "bg-muted" : ""
            }`}
          >
            <span>
              {p.first_name} {p.last_name}
              <span className="ml-2 text-xs text-muted-foreground">{p.phone || ""}</span>
            </span>
            {p.id === value && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>
        ))}
        {patients.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">No patients found.</p>
        )}
      </div>
    </div>
  );
}
