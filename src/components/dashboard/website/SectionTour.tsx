import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GuideSection } from "@/config/websiteSettingsGuide";

type Props = {
  section: GuideSection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SectionTour({ section, open, onOpenChange }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open, section.id]);

  const total = section.steps.length;
  const current = section.steps[step];
  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{section.title} — quick tour</DialogTitle>
          <DialogDescription>{section.appears}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
          <p className="text-sm font-semibold">{current.title}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{current.body}</p>
        </div>

        <div className="flex items-center gap-1.5">
          {section.steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-secondary" : "w-1.5 bg-border"
              }`}
            />
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            Step {step + 1} of {total}
          </span>
        </div>

        <div className="flex justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < total - 1 ? (
            <Button size="sm" className="bg-secondary hover:bg-secondary/90" onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button size="sm" className="bg-secondary hover:bg-secondary/90" onClick={() => onOpenChange(false)}>
              Got it
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
