import type { ReactNode } from "react";
import { BookOpen, CheckCircle2 } from "lucide-react";
import TutorialBreadcrumbs, { type Crumb } from "@/site/components/tutorials/TutorialBreadcrumbs";

type TutorialPageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  breadcrumbs?: Crumb[];
  meta?: string;
  completed?: number;
  total?: number;
};

const TutorialPageHeader = ({
  eyebrow,
  title,
  description,
  breadcrumbs,
  meta,
  completed,
  total,
}: TutorialPageHeaderProps) => {
  const hasProgress = typeof completed === "number" && typeof total === "number" && total > 0;
  const percentage = hasProgress ? Math.round((completed / total) * 100) : 0;

  return (
    <header className="border-b border-border/70 bg-card/30">
      <div className="container max-w-6xl py-10 md:py-14">
        {breadcrumbs && <TutorialBreadcrumbs items={breadcrumbs} />}

        <div className="mt-7 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span className="site-eyebrow">{eyebrow}</span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
            {meta && <p className="mt-4 text-xs font-medium text-muted-foreground">{meta}</p>}
          </div>

          {hasProgress && (
            <div className="w-full max-w-xs border-t border-border/70 pt-5 md:border-l md:border-t-0 md:pl-7 md:pt-0">
              <div className="flex items-center justify-between gap-5 text-xs">
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Your progress
                </span>
                <span className="font-semibold text-primary">{percentage}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full bg-primary transition-[width]" style={{ width: `${percentage}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {completed} of {total} steps complete
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TutorialPageHeader;