import { useState } from "react";
import { Loader2, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOrg } from "@/hooks/useOrg";
import { askClinicAi, postOpPrompt } from "@/lib/aiDental";
import { toast } from "@/hooks/use-toast";

/** AI-drafted, editable post-op instructions based on today's procedures and prescriptions. */
export function PostOpInstructions({ patientId, patientName, procedures, meds }: { patientId?: string | null; patientName?: string; procedures: string[]; meds: string[] }) {
  const { currentOrg } = useOrg();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!currentOrg?.org_id || !patientId) return;
    setLoading(true);
    try {
      setText(await askClinicAi(currentOrg.org_id, postOpPrompt(patientId, procedures, meds), "post-op-instructions"));
    } catch (e: any) {
      toast({ title: "Couldn't draft instructions", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const print = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
    w.document.write(`<html><head><title>Post-op instructions</title></head><body style="font-family:sans-serif;padding:24px;max-width:680px"><h2>Aftercare instructions</h2>${patientName ? `<p><b>Patient:</b> ${esc(patientName)}</p>` : ""}<p><b>Clinic:</b> ${esc(currentOrg?.org_name || "")} · ${new Date().toLocaleDateString()}</p><pre style="white-space:pre-wrap;font-family:inherit;font-size:14px">${esc(text)}</pre></body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post-op instructions</h4>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
            {text ? "Redo with AI" : "Draft with AI"}
          </Button>
          {text && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={print}>
              <Printer className="h-3 w-3 mr-1" /> Print
            </Button>
          )}
        </div>
      </div>
      {text ? (
        <Textarea rows={8} className="text-sm" value={text} onChange={(e) => setText(e.target.value)} />
      ) : (
        <p className="text-xs text-muted-foreground">Draft aftercare tailored to today's treatment. Review before giving it to the patient.</p>
      )}
    </section>
  );
}
