import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import dashboardAsset from "@/assets/current-dashboard/dental-dashboard.png.asset.json";
import SpecialtyStage from "./SpecialtyStage";
import heroOperatory from "@/assets/site/hero-operatory.jpg";

const dashboardScreenshot = dashboardAsset.url;


const HeroSection = () => {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax layers: background orbs drift slow, dashboard floats faster
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -60]);
  const glassCardY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -130]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "18%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.08, reduceMotion ? 1.08 : 1.18]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[hsl(var(--medical-blue-dark))] py-20 md:py-28">
      {/* Background photo on the slowest parallax plane */}
      <motion.div aria-hidden style={{ y: bgY, scale: bgScale }} className="pointer-events-none absolute inset-0 h-[70%] md:h-[80%]">
        <img
          src={heroOperatory}
          alt=""
          width={1920}
          height={1088}
          fetchPriority="high"
          className="h-full w-full object-cover object-[70%_center]"
        />
      </motion.div>
      {/* Dark overlay: readable left copy, fades into the section colour below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--medical-blue-dark) / 0.92) 0%, hsl(var(--medical-blue-dark) / 0.72) 55%, hsl(var(--medical-blue-dark) / 0.5) 100%), linear-gradient(180deg, transparent 0%, transparent 35%, hsl(var(--medical-blue-dark)) 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="container relative z-10">
        <div className="grid items-end gap-12 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <span className="site-eyebrow block">
              Clinexus
            </span>
            <h1 className="mt-5 max-w-2xl text-4xl text-foreground md:text-5xl lg:text-[3.75rem]">
              Healthcare software should understand healthcare.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[hsl(var(--text-secondary))]">
              You do not simply need software that can store patient information.
              You need software that understands how your facility actually operates,
              from your front desk to your treatment rooms. That is exactly what
              Clinexus was built for.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="min-h-11 gap-2 rounded-md bg-primary px-8 text-primary-foreground">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link to="/login">
                <Button size="lg" variant="outline" className="min-h-11 gap-2 rounded-md border-[hsl(var(--site-border-interactive))] bg-transparent px-8 text-foreground hover:bg-[hsl(var(--site-surface-2))] hover:text-foreground">
                  See Demo
                </Button>
              </Link>
            </div>
          </motion.div>

        </div>

        <SpecialtyStage />

        {/* Floating dashboard plane */}
        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="relative mt-16"
        >
          <motion.div
            style={{ y: dashboardY }}
            className="site-hairline-invert overflow-hidden rounded-md shadow-2xl shadow-black/40 md:-rotate-1"
          >
            <img
              src={dashboardScreenshot}
              alt="Clinexus dashboard showing clinic revenue, appointments and patient records"
              className="w-full"
            />
          </motion.div>

          {/* Overlapping glass card on its own faster parallax plane */}
          <motion.div
            style={{ y: glassCardY }}
            initial={{ opacity: 0, y: 32, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 3 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="absolute -top-8 right-4 hidden w-52 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-md md:block"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--medical-teal))]">
              Every specialty
            </div>
            <div className="mt-1 text-xl font-bold text-white">Its own system</div>
            <div className="mt-3 h-1 w-full rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-[hsl(var(--medical-teal))]" />
            </div>
          </motion.div>

          <figcaption className="mt-3 text-xs text-muted-foreground">
            The Clinexus dashboard: today's schedule, outstanding invoices and clinic revenue on one screen.
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
};

export default HeroSection;
