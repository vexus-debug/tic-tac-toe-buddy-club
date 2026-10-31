import { useEffect, useMemo, useState } from "react";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScreenshotInspector from "@/site/components/ScreenshotInspector";
import type { TutorialStep } from "@/site/data/tutorials";

type TutorialStepListProps = {
  tutorialKey: string;
  steps: TutorialStep[];
  onProgressChange?: (completed: number) => void;
};

const TutorialStepList = ({ tutorialKey, steps, onProgressChange }: TutorialStepListProps) => {
  const storageKey = `public-tutorial-progress:${tutorialKey}`;
  const [completed, setCompleted] = useState<number[]>(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const completedSet = useMemo(() => new Set(completed), [completed]);

  useEffect(() => {
    onProgressChange?.(completed.length);
  }, [completed.length, onProgressChange]);

  const toggleStep = (index: number) => {
    setCompleted((current) => {
      const next = current.includes(index) ? current.filter((item) => item !== index) : [...current, index];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <ol className="divide-y divide-border/70 border-y border-border/70">
      {steps.map((step, index) => {
        const isComplete = completedSet.has(index);
        return (
          <li key={step.title} className="py-8 first:pt-0 md:py-10">
            <div className="flex items-start gap-4 md:gap-5">
              <Button
                type="button"
                variant={isComplete ? "default" : "outline"}
                size="icon"
                className="mt-0.5 h-8 w-8 shrink-0 rounded-full"
                onClick={() => toggleStep(index)}
                aria-label={`${isComplete ? "Mark incomplete" : "Mark complete"}: ${step.title}`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
              </Button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted-foreground">STEP {String(index + 1).padStart(2, "0")}</p>
                <h2 className={`mt-2 text-base font-semibold md:text-lg ${isComplete ? "text-muted-foreground" : ""}`}>
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                {step.image && (
                  <div className="mt-5">
                    <ScreenshotInspector src={step.image} alt={step.imageAlt ?? step.title} />
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default TutorialStepList;