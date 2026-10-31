import Layout from "@/site/components/Layout";
import PageHero from "@/site/components/PageHero";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { tutorialClinicTypes, countTutorials } from "@/site/data/tutorials";

const Tutorials = () => {
  return (
    <Layout>
      <PageHero
        eyebrow="Tutorials"
        title="Learn Clinexus, step by step"
        description="Guides for every clinic type — how to set up your practice, run your daily flow and get the most out of each module."
      />

      <section className="py-16 md:py-20">
        <div className="container max-w-5xl">
          <div className="grid gap-px overflow-hidden rounded-md border border-border/70 bg-border/70 md:grid-cols-2">
            {tutorialClinicTypes.map((clinic) => {
              const total = countTutorials(clinic);
              return (
                <Link
                  key={clinic.slug}
                  to={`/tutorials/${clinic.slug}`}
                  className="group flex flex-col bg-card p-8 transition-colors hover:bg-muted/40"
                >
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {clinic.sections.length} topics · {total} {total === 1 ? "guide" : "guides"}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight">{clinic.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{clinic.tagline}</p>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {clinic.description}
                  </p>
                  <span className="mt-6 flex items-center gap-1.5 text-sm font-medium text-primary">
                    Start reading
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Tutorials;
