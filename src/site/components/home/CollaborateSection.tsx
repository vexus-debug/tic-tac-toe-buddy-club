import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import ParallaxBackdrop from "./ParallaxBackdrop";
import chartsAsset from "@/assets/current-dashboard/dental-charts.png.asset.json";

const activity = [
  { initials: "FA", name: "Dr. Funke Adeyemi, BDS", action: "Charted tooth 46", status: "Completed", time: "2 min ago" },
  { initials: "IB", name: "Ibrahim, Lab Tech", action: "Zirconia crown, case #412", status: "Dispatched", time: "5 min ago" },
  { initials: "CN", name: "Chioma N., Front Desk", action: "Patient checked in", status: "HMO verified", time: "8 min ago" },
];

const roles = ["Specialist view", "Front desk", "Lab tech", "Practice director"];

const CollaborateSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], [24, -24]);

  return (
    <section ref={ref} className="relative site-band-obsidian overflow-hidden py-20 md:py-28">
      <ParallaxBackdrop src={chartsAsset.url} speed={0.18} opacity={0.3} />
      <div className="container relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="site-hairline rounded-md bg-card/80 p-5 backdrop-blur-sm">
              <div className="mb-4 text-[11px] uppercase tracking-widest text-muted-foreground">Live clinic activity</div>
              <ul className="space-y-3">
                {activity.map((a) => (
                  <li key={a.name} className="flex items-center gap-3 rounded-md border border-border bg-background/60 px-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {a.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{a.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{a.action}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-primary">{a.status}</div>
                      <div className="text-[11px] text-muted-foreground">{a.time}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <motion.div
              style={{ y: reduce ? 0 : drift }}
              className="site-hairline absolute -right-3 -top-5 rounded-md bg-card px-4 py-2 text-xs"
            >
              <span className="font-semibold text-foreground">Audit log</span>
              <span className="ml-2 text-muted-foreground">every action tracked</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Software That Understands Who Is in the Room
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
              A dentist never sees ophthalmology fields. An optometrist never navigates hospital inpatient forms. Every specialist works with the tools their discipline demands, and nothing else.
            </p>
            <div className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">Access shaped by role</div>
            <ul className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <li key={r} className="site-chip">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Names shown are examples.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CollaborateSection;
