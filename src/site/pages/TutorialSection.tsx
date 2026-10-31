import Layout from "@/site/components/Layout";
import PageHero from "@/site/components/PageHero";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import TutorialBreadcrumbs from "@/site/components/tutorials/TutorialBreadcrumbs";
import TutorialSidebar from "@/site/components/tutorials/TutorialSidebar";
import { getClinicType, getSection } from "@/site/data/tutorials";

const TutorialSection = () => {
  const { clinicType, section: sectionSlug } = useParams();
  const clinic = getClinicType(clinicType);
  const section = getSection(clinicType, sectionSlug);

  if (!clinic) return <Navigate to="/tutorials" replace />;
  if (!section) return <Navigate to={`/tutorials/${clinic.slug}`} replace />;

  const index = clinic.sections.findIndex((s) => s.slug === section.slug);

  return (
    <Layout>
      <PageHero eyebrow={clinic.name} title={section.title} description={section.description} />

      <section className="py-12 md:py-16">
        <div className="container max-w-6xl">
          <TutorialBreadcrumbs
            items={[
              { label: "Tutorials", to: "/tutorials" },
              { label: clinic.name, to: `/tutorials/${clinic.slug}` },
              { label: section.title },
            ]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_1fr]">
            <TutorialSidebar clinic={clinic} activeSection={section.slug} />

            <div data-tutorial-content>
              <p className="text-sm text-muted-foreground">
                Topic {index + 1} of {clinic.sections.length} ·{" "}
                {section.tutorials.length > 0
                  ? `${section.tutorials.length} ${section.tutorials.length === 1 ? "guide" : "guides"}`
                  : "No guides yet"}
              </p>

              {section.tutorials.length === 0 ? (
                <div className="mt-5 rounded-md border border-dashed border-border bg-muted/20 p-12 text-center">
                  <h2 className="text-base font-semibold">Guides coming soon</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    We're writing the {section.title.toLowerCase()} tutorials for {clinic.name.toLowerCase()}.
                    Check back shortly.
                  </p>
                </div>
              ) : (
                <ol className="mt-5 divide-y divide-border/70 overflow-hidden rounded-md border border-border/70 bg-card">
                  {section.tutorials.map((tutorial, i) => (
                    <li key={tutorial.slug}>
                      <Link
                        to={`/tutorials/${clinic.slug}/${section.slug}/${tutorial.slug}`}
                        className="group flex items-start gap-5 px-6 py-5 transition-colors hover:bg-muted/40"
                      >
                        <span className="mt-0.5 w-6 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{tutorial.title}</span>
                          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                            {tutorial.summary}
                          </span>
                        </span>
                        <span className="hidden shrink-0 pt-0.5 text-xs text-muted-foreground sm:block">
                          {[tutorial.level, tutorial.duration].filter(Boolean).join(" · ")}
                        </span>
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ol>
              )}

              <div className="mt-10 border-t border-border/70 pt-6">
                <Link
                  to={`/tutorials/${clinic.slug}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to {clinic.name}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TutorialSection;
