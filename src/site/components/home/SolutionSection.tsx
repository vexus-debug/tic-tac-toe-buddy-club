import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import {
  HiSignal,
  HiUsers,
  HiChartBar,
  HiArrowTrendingUp,
  HiClock,
  HiExclamationTriangle,
} from "react-icons/hi2";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const panelShadow =
  "shadow-[0px_3px_8px_-1px_rgba(0,0,0,0.03),0px_1px_2px_-1px_rgba(0,0,0,0.04),0px_2px_4px_0px_rgba(0,0,0,0.04)]";

const WorkflowPanel = () => (
  <div
    className={`bg-background dark:bg-background/60 flex min-h-[350px] flex-col justify-between rounded-[2rem] p-4 ${panelShadow}`}
  >
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground flex items-center gap-1 text-sm">
        <HiSignal className="text-primary h-4 w-4" />
        Today's schedule
      </span>
      <span className="text-primary text-xs">● live</span>
    </div>

    <div className="flex items-end justify-between">
      <div className="text-foreground text-4xl font-semibold">24 visits</div>
      <div className="text-primary text-sm">+12%</div>
    </div>

    <div className="flex h-24 items-end gap-2">
      {[40, 60, 35, 80, 55, 90, 70].map((h, i) => (
        <div
          key={i}
          className="bg-primary/80 w-full rounded-md"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>

    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="bg-muted rounded-lg p-3">
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <HiClock className="h-3 w-3" />
          Charting
        </div>
        <div className="text-foreground text-lg font-medium">3.2 min</div>
      </div>
      <div className="bg-muted rounded-lg p-3">
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <HiExclamationTriangle className="h-3 w-3" />
          Wait time
        </div>
        <div className="text-primary text-lg font-medium">4 min</div>
      </div>
    </div>
  </div>
);

const OperationsPanel = () => (
  <div
    className={`bg-background dark:bg-background/60 flex min-h-[350px] flex-col justify-between rounded-[2rem] p-4 ${panelShadow}`}
  >
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground flex items-center gap-1 text-sm">
        <HiUsers className="text-primary h-4 w-4" />
        Specialty ops
      </span>
      <span className="text-muted-foreground text-xs">3 workflows</span>
    </div>

    <div className="flex items-center justify-center">
      <div className="border-primary/20 relative flex h-28 w-28 items-center justify-center rounded-full border-8">
        <div className="border-primary absolute h-full w-full rotate-45 rounded-full border-8 border-t-transparent" />
        <span className="text-foreground text-xl font-semibold">92%</span>
      </div>
    </div>

    <div className="space-y-3">
      {[
        { name: "Dental billing", value: "98%" },
        { name: "Lab case tracking", value: "91%" },
        { name: "Optical inventory", value: "87%" },
      ].map((item) => (
        <div key={item.name} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{item.name}</span>
          <span className="text-foreground font-medium">{item.value}</span>
        </div>
      ))}
    </div>

    <div className="flex gap-2">
      <div className="bg-primary h-2 flex-1 rounded-full" />
      <div className="bg-primary/60 h-2 flex-1 rounded-full" />
      <div className="bg-primary/30 h-2 flex-1 rounded-full" />
    </div>
  </div>
);

const SystemsPanel = () => (
  <div
    className={`bg-background dark:bg-background/60 flex min-h-[350px] flex-col justify-between rounded-[2rem] p-4 ${panelShadow}`}
  >
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground flex items-center gap-1 text-sm">
        <HiChartBar className="text-primary h-4 w-4" />
        Systems live
      </span>
      <span className="text-primary border-primary/20 bg-primary/5 rounded-3xl border px-2 text-xs">
        +6.2%
      </span>
    </div>

    <div className="text-foreground text-5xl font-semibold">9</div>

    <div className="space-y-4">
      {[
        { label: "Dentistry", value: 96 },
        { label: "Eye care", value: 94 },
        { label: "Diagnostics", value: 90 },
      ].map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>{item.label}</span>
            <span>{item.value}%</span>
          </div>
          <div className="bg-muted h-2 w-full rounded-full">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${item.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>

    <div className="bg-muted flex justify-between rounded-lg p-3 text-sm">
      <span className="text-muted-foreground flex items-center gap-1">
        <HiArrowTrendingUp className="h-4 w-4" />
        Coverage
      </span>
      <span className="text-primary font-medium">Expanding</span>
    </div>
  </div>
);

const pillars = [
  {
    title: "Native Clinical Workflows",
    sub: "Perio charting for dental. Refraction and lens orders for eye care. Real clinical tools, not blank notes.",
    panel: <WorkflowPanel />,
  },
  {
    title: "Specialty Operations",
    sub: "Multi visit treatment billing, specialized lab tracking and optical inventory, handled the way your field handles them.",
    panel: <OperationsPanel />,
  },
  {
    title: "One Platform, Distinct Systems",
    sub: "Every specialty gets its own dedicated system. No forced compromises.",
    panel: <SystemsPanel />,
  },
];

const PillarCard = ({ pillar, index }: { pillar: (typeof pillars)[number]; index: number }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.06 }}
      className="h-full w-[86%] flex-none snap-center md:w-auto"
    >
      <Card className="bg-muted/40 flex h-full flex-col rounded-[40px] p-0 border-border/60">
        <CardContent className="flex h-full flex-col gap-8 p-4">
          <div className="text-center">
            <h3 className="text-foreground text-2xl font-semibold">{pillar.title}</h3>
            <p className="text-muted-foreground mt-1.5 text-sm/6">
              {pillar.sub}
            </p>
          </div>
          {pillar.panel}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SolutionSection = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section className="site-band-porcelain relative overflow-hidden py-20 md:py-28">
      <div className="container relative z-10 flex w-full flex-col">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 flex items-center gap-3"
          >
            <span className="h-[2px] w-8 bg-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              The Problem We Solve
            </span>
          </motion.div>
          <motion.h2
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-foreground text-3xl font-extrabold tracking-tight md:text-4xl lg:text-[2.75rem] lg:leading-[1.12]"
          >
            When Healthcare Software Is Built{" "}
            <span className="text-foreground/40">
              for Everyone, It Works for{" "}
            </span>
            No One
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mt-8 pl-6"
          >
            <span className="bg-border absolute left-0 top-0 h-full w-px" />
            <p className="text-lg font-medium leading-relaxed text-foreground md:text-xl">
              A dental practice, an eye clinic, a diagnostic lab and a fertility
              centre work completely differently.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              Generic software forces your specialty's core clinical processes
              into text boxes, plugins and manual workarounds. Clinexus
              delivers a dedicated system built for the realities of your
              field.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-8 flex items-center gap-2 text-xs font-semibold text-primary"
          >
            <span>Explore our specialized solutions</span>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </div>

        <div className="-mx-6 mt-12 flex w-[calc(100%+3rem)] snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:w-full md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
          {pillars.map((pillar, i) => (
            <PillarCard key={pillar.title} pillar={pillar} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          <Link to="/industries">
            <Button className="gap-2 rounded-lg bg-primary px-8 text-primary-foreground shadow-md hover:opacity-90">
              See How We Do It <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionSection;
