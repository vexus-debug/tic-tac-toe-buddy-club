import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Circle, X, Columns2 } from "lucide-react";
import { PatientOdontogram } from "@/components/dashboard/PatientOdontogram";
import { PatientImageThumb } from "@/components/dashboard/PatientImageThumb";
import { PHASES, procedurePhase } from "@/lib/dentalPhases";

interface Props {
  patientId: string;
  firstName: string;
  showChart: boolean;
  plans: any[];
  images: any[];
  onExit: () => void;
}

/** Patient-facing presentation: no money, no internal notes, no admin alerts. */
export function ChairsideEducationView({ patientId, firstName, showChart, plans, images, onExit }: Props) {
  const [zoom, setZoom] = useState<any>(null);
  const [compare, setCompare] = useState<string[]>([]);

  const items = plans
    .filter((p) => p.status !== "cancelled" && p.status !== "rejected")
    .flatMap((p) => p.treatment_plan_items || [])
    .filter((i: any) => i.status !== "cancelled");

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c.slice(-1), id]));
  const compared = images.filter((i) => compare.includes(i.id));

  return (
    <div className="space-y-8 rounded-2xl border bg-background p-4 md:p-8">
      <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:-mt-8 md:px-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Your smile plan</p>
          <h1 className="text-2xl font-semibold md:text-3xl">Hello, {firstName}</h1>
        </div>
        <Button size="lg" onClick={onExit}>
          <X className="mr-2 h-4 w-4" /> Exit chairside view
        </Button>
      </div>

      {showChart && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Your teeth</h2>
          <PatientOdontogram patientId={patientId} canEdit={false} />
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">X-rays & photos</h2>
          {images.length > 1 && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Columns2 className="h-4 w-4" /> Tick two images to compare side by side
            </p>
          )}
        </div>
        {images.length === 0 ? (
          <p className="text-muted-foreground">No images yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className={`overflow-hidden rounded-xl border ${compare.includes(img.id) ? "ring-2 ring-primary" : ""}`}>
                <button type="button" className="block aspect-square w-full bg-muted" onClick={() => setZoom(img)}>
                  <PatientImageThumb path={img.image_url} alt={img.description} />
                </button>
                <label className="flex cursor-pointer items-center gap-2 p-2 text-sm">
                  <input type="checkbox" checked={compare.includes(img.id)} onChange={() => toggleCompare(img.id)} />
                  <span className="truncate capitalize">{img.description || img.image_type}</span>
                </label>
              </div>
            ))}
          </div>
        )}
        {compared.length === 2 && (
          <div className="grid grid-cols-2 gap-4">
            {compared.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-xl border bg-muted">
                <PatientImageThumb path={img.image_url} alt={img.description} />
                <p className="bg-background p-2 text-sm">{img.date_taken}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Your treatment, step by step</h2>
        {items.length === 0 ? (
          <p className="text-muted-foreground">No treatment planned yet.</p>
        ) : (
          PHASES.map((ph) => {
            const list = items.filter((i: any) => (i.phase || procedurePhase(i.description)) === ph.id);
            if (!list.length) return null;
            return (
              <div key={ph.id} className="space-y-2">
                <Badge variant="secondary" className="text-sm">{ph.title}</Badge>
                <ul className="space-y-2">
                  {list.map((i: any) => {
                    const done = i.status === "completed";
                    return (
                      <li key={i.id} className="flex items-center gap-3 rounded-xl border p-4 text-lg">
                        {done ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
                        <span className={done ? "text-muted-foreground line-through" : ""}>
                          {i.description}{i.tooth_number ? ` — Tooth #${i.tooth_number}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </section>

      <Dialog open={!!zoom} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-w-5xl">
          <DialogTitle className="capitalize">{zoom?.description || zoom?.image_type}</DialogTitle>
          {zoom && <div className="max-h-[80vh] overflow-auto"><PatientImageThumb path={zoom.image_url} alt={zoom.description} /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
