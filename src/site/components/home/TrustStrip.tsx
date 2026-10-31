import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";

const stats = [
  {
    value: 500,
    render: (v: number) => `${v}+`,
    label: "Clinics like yours, running without the chaos",
  },
  {
    value: 40,
    render: (v: number) => `${v}%`,
    label: "Fewer patients who never show up",
  },
  {
    value: 60,
    render: (v: number) => `${v}%`,
    label: "Less time buried in admin",
  },
  {
    value: 4.8,
    render: (v: number) => `₦${v.toFixed(1)}M`,
    label: "Avg. monthly revenue you could be tracking",
  },
];

const TrustStrip = () => {
  const reduceMotion = useReducedMotion();
  const startedRef = useRef(false);
  const [started, setStarted] = useState(false);

  return (
    <section aria-label="Clinexus results at a glance" className="relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          onViewportEnter={() => {
            if (!startedRef.current) {
              startedRef.current = true;
              setStarted(true);
            }
          }}
          transition={{ duration: 0.5 }}
          className="grid border-y border-border/30 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: reduceMotion ? 0 : i * 0.08 }}
              className={`px-6 py-8 lg:py-10 ${i > 0 ? "border-t border-border/30 sm:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-l sm:border-border/30" : ""} ${i >= 2 ? "lg:border-l lg:border-border/30" : ""}`}
            >
              <div className="text-3xl font-extrabold tabular-nums text-foreground md:text-4xl">
                {started ? (
                  <AnimatedCounter value={s.value} formatter={s.render} duration={reduceMotion ? 0 : 1100} />
                ) : (
                  s.render(s.value)
                )}
              </div>
              <p className="mt-2 max-w-[16rem] text-sm font-medium text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustStrip;
