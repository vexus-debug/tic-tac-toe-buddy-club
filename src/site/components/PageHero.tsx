import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import HeroBackdrop from "./HeroBackdrop";

type ProofPoint = { value: string; label: string };

type Cta = {
  label: string;
  href: string;
  external?: boolean;
  variant?: "primary" | "outline";
};

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  points?: ProofPoint[];
};

const CtaButton = ({ cta }: { cta: Cta }) => {
  const className =
    cta.variant === "outline"
      ? "gap-2 rounded-sm border-white/25 bg-transparent px-8 text-white hover:bg-white/10"
      : "gap-2 rounded-sm bg-primary px-8 text-white hover:opacity-90";

  const button = (
    <Button size="lg" variant={cta.variant === "outline" ? "outline" : "default"} className={className}>
      {cta.label} <ArrowRight className="h-4 w-4" />
    </Button>
  );

  if (cta.external) {
    return (
      <a href={cta.href} target="_blank" rel="noopener noreferrer">
        {button}
      </a>
    );
  }
  return <Link to={cta.href}>{button}</Link>;
};

const PageHero = ({ eyebrow, title, description, primaryCta, secondaryCta, points = [] }: PageHeroProps) => {
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--medical-blue-dark))] py-20 md:py-28">
      <HeroBackdrop />
      <div className="container relative z-10">
        <div className="grid items-end gap-12 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={points.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}
          >
            <span className="site-eyebrow block text-white/50">{eyebrow}</span>
            <h1 className="mt-5 max-w-2xl text-4xl text-white md:text-5xl lg:text-[3.75rem]">{title}</h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/60">{description}</p>
            {(primaryCta || secondaryCta) && (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {primaryCta && <CtaButton cta={primaryCta} />}
                {secondaryCta && <CtaButton cta={{ variant: "outline", ...secondaryCta }} />}
              </div>
            )}
          </motion.div>

          {points.length > 0 && (
            <motion.dl
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-5"
            >
              <div className="divide-y divide-white/10 border-y border-white/10">
                {points.map((point) => (
                  <div key={point.value} className="flex items-baseline gap-5 py-5">
                    <dt className="w-24 shrink-0 text-2xl text-white">{point.value}</dt>
                    <dd className="text-sm leading-relaxed text-white/50">{point.label}</dd>
                  </div>
                ))}
              </div>
            </motion.dl>
          )}
        </div>
      </div>
    </section>
  );
};

export default PageHero;
