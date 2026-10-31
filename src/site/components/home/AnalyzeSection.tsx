import { motion } from "framer-motion";
import profitabilityAsset from "@/assets/current-dashboard/dental-profitability.png.asset.json";

const profitabilityScreenshot = profitabilityAsset.url;

const marginChips = [
  { label: "Root Canal", value: "68% margin" },
  { label: "Staff commission", value: "Auto-calculated" },
  { label: "Audit export", value: "One click" },
  { label: "Trends", value: "Flagged early" },
];

const AnalyzeSection = () => {
  return (
    <section className="relative site-band-porcelain overflow-hidden py-20 md:py-28">
      <div className="container relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 flex flex-wrap gap-3">
              <div className="site-hairline rounded-md bg-card px-4 py-3">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Collected today</div>
                <div className="font-mono text-xl font-semibold text-foreground">₦4,850,000</div>
              </div>
              <div className="site-hairline rounded-md bg-card px-4 py-3">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Avg chair yield</div>
                <div className="font-mono text-xl font-semibold text-primary">+28%</div>
              </div>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Finally See Where Your Money Really Comes From
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
              See which treatments make you the most money, which patients keep coming back, and where every naira goes, updated in real time, ready to export whenever you need it.
            </p>
            <ul className="flex flex-wrap gap-2">
              {marginChips.map((c) => (
                <li key={c.label} className="site-chip">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-semibold">{c.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Example figures from a sample clinic.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <figure className="site-hairline overflow-hidden rounded-md bg-card">
              <img
                src={profitabilityScreenshot}
                alt="Clinexus profitability report showing revenue by service and clinic costs"
                className="w-full"
              />
              <figcaption className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
                Profitability by service, updated as invoices are paid.
              </figcaption>
            </figure>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AnalyzeSection;
