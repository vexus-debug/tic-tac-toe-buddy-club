import { useState } from "react";
import { HelpCircle, ChevronRight, ChevronLeft, X, CheckCircle2, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TutorialStep {
  title: string;
  description: string;
  tip?: string;
}

export interface PageTutorialProps {
  title: string;
  description: string;
  steps: TutorialStep[];
  nextPageHint?: {
    label: string;
    description: string;
  };
}

export function PageTutorial({ title, description, steps, nextPageHint }: PageTutorialProps) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => setActiveStep(0), 300);
  };

  const goNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const goPrev = () => setActiveStep((s) => Math.max(s - 1, 0));
  const isLast = activeStep === steps.length - 1;
  const isFirst = activeStep === 0;

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground px-2.5 py-1.5 text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:border-primary/30 group"
        title="How to use this page"
      >
        <HelpCircle className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">How to use</span>
      </button>

      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[420px] p-0 flex flex-col bg-card border-border/60 overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-primary/10 via-card to-card border-b border-border/50 p-6">
            <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-primary/8 blur-2xl" />
            <SheetHeader className="space-y-0 text-left relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
                  <HelpCircle className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Page Guide</span>
              </div>
              <SheetTitle className="text-lg font-bold text-foreground leading-tight">{title}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </SheetHeader>
          </div>

          {/* Step progress bar */}
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step {activeStep + 1} of {steps.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(((activeStep + 1) / steps.length) * 100)}% complete
              </span>
            </div>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={cn(
                    "flex-1 h-1.5 rounded-full transition-all duration-300",
                    i <= activeStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Step dots navigation */}
          <div className="px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all border",
                  i === activeStep
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : i < activeStep
                    ? "bg-muted border-border text-muted-foreground"
                    : "bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted/70"
                )}
              >
                {i < activeStep ? (
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <span className={cn(
                    "h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                    i === activeStep ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {i + 1}
                  </span>
                )}
                <span className="truncate max-w-[100px]">{step.title}</span>
              </button>
            ))}
          </div>

          {/* Active step content */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Main step card */}
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                      {activeStep + 1}
                    </div>
                    <h3 className="font-bold text-foreground text-base leading-tight">
                      {steps[activeStep].title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {steps[activeStep].description}
                  </p>
                </div>

                {/* Tip */}
                {steps[activeStep].tip && (
                  <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/8 p-4">
                    <Lightbulb className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-warning-foreground leading-relaxed">{steps[activeStep].tip}</p>
                  </div>
                )}

                {/* Next page hint — shown on last step */}
                {isLast && nextPageHint && (
                  <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/8 p-4">
                    <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-primary mb-0.5">Next step in workflow:</p>
                      <p className="text-xs font-bold text-foreground">{nextPageHint.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{nextPageHint.description}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation footer */}
          <div className="border-t border-border/50 px-6 py-4 flex items-center justify-between gap-3 bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={goPrev}
              disabled={isFirst}
              className="gap-1.5 border-border/60"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>

            <span className="text-xs text-muted-foreground font-mono">
              {activeStep + 1} / {steps.length}
            </span>

            {isLast ? (
              <Button
                size="sm"
                onClick={handleClose}
                className="gap-1.5 bg-primary hover:bg-primary/90"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Got it!
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={goNext}
                className="gap-1.5 bg-primary hover:bg-primary/90"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
