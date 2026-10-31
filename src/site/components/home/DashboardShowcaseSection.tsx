import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ParallaxBackdrop from "./ParallaxBackdrop";

import dashboardAsset from "@/assets/current-dashboard/dental-dashboard.png.asset.json";
import patientsAsset from "@/assets/current-dashboard/dental-patients.png.asset.json";
import dentalChartsAsset from "@/assets/current-dashboard/dental-charts.png.asset.json";
import profitabilityAsset from "@/assets/current-dashboard/dental-profitability.png.asset.json";
import treatmentsAsset from "@/assets/current-dashboard/dental-treatments.png.asset.json";
import inventoryAsset from "@/assets/current-dashboard/dental-inventory.png.asset.json";
import eyeDashboardAsset from "@/assets/current-dashboard/eye-dashboard.png.asset.json";
import eyeExamsAsset from "@/assets/current-dashboard/eye-exams.png.asset.json";
import eyeChartsAsset from "@/assets/current-dashboard/eye-charts.png.asset.json";
import eyePrescriptionsAsset from "@/assets/current-dashboard/eye-prescriptions.png.asset.json";
import eyeOrdersAsset from "@/assets/current-dashboard/eye-orders.png.asset.json";
import eyeContactLensesAsset from "@/assets/current-dashboard/eye-contact-lenses.png.asset.json";

const galleries = {
  dental: [
    { src: dashboardAsset.url, label: "Dashboard" },
    { src: patientsAsset.url, label: "Patients" },
    { src: dentalChartsAsset.url, label: "Dental Charts" },
    { src: profitabilityAsset.url, label: "Profitability" },
    { src: treatmentsAsset.url, label: "Treatments" },
    { src: inventoryAsset.url, label: "Inventory" },
  ],
  eye: [
    { src: eyeDashboardAsset.url, label: "Overview" },
    { src: eyeExamsAsset.url, label: "Exams" },
    { src: eyeChartsAsset.url, label: "Eye Charts" },
    { src: eyePrescriptionsAsset.url, label: "Prescriptions" },
    { src: eyeOrdersAsset.url, label: "Lens Orders" },
    { src: eyeContactLensesAsset.url, label: "Contact Lenses" },
  ],
} as const;

type GalleryKey = keyof typeof galleries;

const tabs: { key: GalleryKey; label: string; caption: string }[] = [
  { key: "dental", label: "Dental system", caption: "Tooth charts, treatment plans and the money they leave behind." },
  { key: "eye", label: "Eye care system", caption: "Refractions, prescriptions and the optical desk that fulfils them." },
];

const DashboardShowcaseSection = () => {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<GalleryKey>("dental");
  const current = tabs.find((t) => t.key === active)!;

  return (
    <section className="relative site-band-theater overflow-hidden py-20 md:py-28">
      <ParallaxBackdrop src={dashboardAsset.url} speed={0.22} opacity={0.3} />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 max-w-2xl"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Purpose built for the chair, not adapted from a template
          </h2>
          <p className="mt-4 text-muted-foreground">
            Real screens from inside Clinexus. Switch systems and see how different the work looks when the software speaks your specialty's language.
          </p>
        </motion.div>

        {/* Specialty switcher */}
        <div role="tablist" aria-label="Choose a system to preview" className="mb-4 flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const on = tab.key === active;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(tab.key)}
                className="group relative min-h-11 rounded-full border px-5 py-2 text-sm font-semibold transition-colors"
              >
                {on && (
                  <motion.span
                    layoutId="showcase-tab"
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                )}
                <span className={`relative ${on ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mb-10 text-sm text-muted-foreground">{current.caption}</p>

        {/* Crossfading screen gallery */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="scrollbar-hide -mx-4 flex gap-5 overflow-x-auto px-4 pb-4 snap-x snap-mandatory"
          >
            {galleries[active].map((item) => (
              <motion.figure
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex-none snap-center"
              >
                <div className="w-[220px] md:w-[260px]">
                  <div className="rounded-[2rem] border-[5px] border-foreground/10 bg-foreground/5 p-1.5">
                    <div className="overflow-hidden rounded-[1.5rem]">
                      <img src={item.src} alt={`${item.label} screen in the Clinexus ${current.label.toLowerCase()}`} className="w-full" loading="lazy" />
                    </div>
                  </div>
                  <figcaption className="mt-3 text-center text-sm font-semibold text-foreground">{item.label}</figcaption>
                </div>
              </motion.figure>
            ))}
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <Link to="/industries">
            <Button size="lg" className="gap-2 rounded-md bg-primary text-primary-foreground">
              Take the Full Tour <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardShowcaseSection;
