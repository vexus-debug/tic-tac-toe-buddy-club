import Layout from "@/site/components/Layout";
import PageHero from "@/site/components/PageHero";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import TutorialBreadcrumbs from "@/site/components/tutorials/TutorialBreadcrumbs";
import TutorialSidebar from "@/site/components/tutorials/TutorialSidebar";
import { getClinicType, countTutorials } from "@/site/data/tutorials";

const TutorialClinicType = () => {
  const { clinicType } = useParams();
  const clinic = getClinicType(clinicType);

  if (!clinic) return <Navigate to="/tutorials" replace />;

  const total = countTutorials(clinic);

  return (
    <Layout>
      <PageHero eyebrow="Tutorials" title={clinic.name} description={clinic.description} />

      <section className="py-12 md:py-16">
        <div className="container max-w-6xl">
          <TutorialBreadcrumbs
            items={[{ label: "Tutorials", to: "/tutorials" }, { label: clinic.name }]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_1fr]">
            <TutorialSidebar clinic={clinic} />

            <div>
              <p className="text-sm text-muted-foreground">
                {clinic.sections.length} topics · {total} {total === 1 ? "guide" : "guides"} available
              </p>

              <ol className="mt-5 divide-y divide-border/70 overflow-hidden rounded-md border border-border/70 bg-card">
                {clinic.sections.map((section, i) => (
                  <li key={section.slug}>
                    <Link
                      to={`/tutorials/${clinic.slug}/${section.slug}`}
                      className="group flex items-start gap-5 px-6 py-5 transition-colors hover:bg-muted/40"
                    >
                      <span className="mt-0.5 w-6 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{section.title}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                          {section.description}
                        </span>
                      </span>
                      <span className="hidden shrink-0 pt-0.5 text-xs text-muted-foreground sm:block">
                        {section.tutorials.length > 0 ? `${section.tutorials.length} guides` : "Coming soon"}
                      </span>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ol>

              <div className="mt-10 border-t border-border/70 pt-6">
                <Link
                  to="/tutorials"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> All tutorials
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TutorialClinicType;
