import Layout from "@/site/components/Layout";
import { ChangelogHero } from "@/site/components/heroes";
import { motion } from "framer-motion";
import { Sparkles, Wrench, ArrowUpCircle, ArrowRight, Zap } from "lucide-react";
import { updates, kindLabel, type UpdateKind } from "@/data/updates";

const APP_URL = "https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus";

const kindIcon: Record<UpdateKind, typeof Sparkles> = {
  feature: Sparkles,
  improvement: ArrowUpCircle,
  fix: Wrench,
};

const kindBadgeClass: Record<UpdateKind, string> = {
  feature: "bg-primary/10 text-primary border-primary/20",
  improvement: "bg-[hsl(var(--medical-teal))]/10 text-[hsl(var(--medical-teal))] border-[hsl(var(--medical-teal))]/20",
  fix: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

const Updates = () => {
  return (
    <Layout>
      <ChangelogHero
        title="What's new in Clinexus."
        description="Every new feature, improvement and bug fix we ship — logged here so your team always knows what changed."
        latest={updates[0]}
        total={updates.length}
      />

      <section className="relative site-section-light overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-background" />
        <div className="container relative z-10 max-w-4xl">
          {/* Update timeline */}
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 hidden w-px bg-border sm:block" />

            <div className="space-y-10">
              {updates.map((entry, i) => (
                <motion.div
                  key={entry.version}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="relative sm:pl-12"
                >
                  {/* Timeline node */}
                  <div className="absolute left-0 top-6 hidden h-[23px] w-[23px] items-center justify-center rounded-full border border-primary/30 bg-primary/10 sm:flex">
                    <Zap className="h-3 w-3 text-primary" />
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:border-primary/30 hover:shadow-lg">
                    {/* Entry header */}
                    <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-primary/[0.03] px-6 py-4">
                      <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                        {entry.version}
                      </span>
                      <span className="text-sm font-medium text-foreground/60">{entry.date}</span>
                      <span className={`ml-auto rounded-full border px-3 py-1 text-xs font-semibold ${kindBadgeClass[entry.kind]}`}>
                        {kindLabel[entry.kind]}
                      </span>
                    </div>

                    <div className="px-6 py-6">
                      <h2 className="mb-5 text-xl font-bold tracking-tight text-foreground">{entry.title}</h2>
                      <ul className="space-y-4">
                        {entry.items.map((item, j) => {
                          const Icon = kindIcon[item.kind];
                          return (
                            <li key={j} className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${kindBadgeClass[item.kind]}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Stay in the loop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-16 rounded-2xl border border-border bg-card p-8 text-center"
          >
            <h3 className="mb-2 text-lg font-bold text-foreground">This page keeps growing</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              We update Clinexus regularly and log every change here — new features, improvements and fixes included.
            </p>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer">
              <span className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Talk to us <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Updates;
