import Layout from "@/site/components/Layout";
import PageHero from "@/site/components/PageHero";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import TutorialBreadcrumbs from "@/site/components/tutorials/TutorialBreadcrumbs";
import TutorialSidebar from "@/site/components/tutorials/TutorialSidebar";
import ScreenshotInspector from "@/site/components/ScreenshotInspector";
import { getClinicType, getSection, getTutorial } from "@/site/data/tutorials";

const TutorialDetail = () => {
  const { clinicType, section: sectionSlug, tutorial: tutorialSlug } = useParams();
  const clinic = getClinicType(clinicType);
  const section = getSection(clinicType, sectionSlug);
  const tutorial = getTutorial(clinicType, sectionSlug, tutorialSlug);

  if (!clinic) return <Navigate to="/tutorials" replace />;
  if (!section) return <Navigate to={`/tutorials/${clinic.slug}`} replace />;
  if (!tutorial) return <Navigate to={`/tutorials/${clinic.slug}/${section.slug}`} replace />;

  const index = section.tutorials.findIndex((t) => t.slug === tutorial.slug);
  const previous = index > 0 ? section.tutorials[index - 1] : undefined;
  const next = index >= 0 && index < section.tutorials.length - 1 ? section.tutorials[index + 1] : undefined;
  const steps = tutorial.steps ?? [];

  return (
    <Layout>
      <PageHero
        eyebrow={`${clinic.name} · ${section.title}`}
        title={tutorial.title}
        description={tutorial.summary}
      />

      <article className="py-12 md:py-16">
        <div className="container max-w-6xl">
          <TutorialBreadcrumbs
            items={[
              { label: "Tutorials", to: "/tutorials" },
              { label: clinic.name, to: `/tutorials/${clinic.slug}` },
              { label: section.title, to: `/tutorials/${clinic.slug}/${section.slug}` },
              { label: tutorial.title },
            ]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_1fr]">
            <TutorialSidebar clinic={clinic} activeSection={section.slug} activeTutorial={tutorial.slug} />

            <div data-tutorial-content className="min-w-0 max-w-3xl">
              <p className="text-sm text-muted-foreground">
                Guide {index + 1} of {section.tutorials.length}
                {[tutorial.level, tutorial.duration].filter(Boolean).length > 0 &&
                  ` · ${[tutorial.level, tutorial.duration].filter(Boolean).join(" · ")}`}
              </p>

              <ol className="mt-8 space-y-10">
                {steps.map((step, i) => (
                  <li key={step.title} className="flex gap-5">
                    <span className="w-6 shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold">{step.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                      {step.image && (
                        <div className="mt-4">
                          <ScreenshotInspector src={step.image} alt={step.imageAlt ?? step.title} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-14 grid gap-3 border-t border-border/70 pt-6 sm:grid-cols-2">
                {previous ? (
                  <Link
                    to={`/tutorials/${clinic.slug}/${section.slug}/${previous.slug}`}
                    className="rounded-md border border-border/70 bg-card px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ArrowLeft className="h-3.5 w-3.5" /> Previous
                    </span>
                    <span className="mt-1 block text-sm font-medium">{previous.title}</span>
                  </Link>
                ) : (
                  <Link
                    to={`/tutorials/${clinic.slug}/${section.slug}`}
                    className="rounded-md border border-border/70 bg-card px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </span>
                    <span className="mt-1 block text-sm font-medium">{section.title}</span>
                  </Link>
                )}

                {next && (
                  <Link
                    to={`/tutorials/${clinic.slug}/${section.slug}/${next.slug}`}
                    className="rounded-md border border-border/70 bg-card px-4 py-3 text-right transition-colors hover:bg-muted/40"
                  >
                    <span className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                      Next <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    <span className="mt-1 block text-sm font-medium">{next.title}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default TutorialDetail;
