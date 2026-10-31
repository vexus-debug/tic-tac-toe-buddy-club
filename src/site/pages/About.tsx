import Layout from "@/site/components/Layout";
import PageHero from "@/site/components/PageHero";
import { motion } from "framer-motion";
import { Shield, Zap, Heart, Lightbulb, CheckCircle2, ArrowRight, Target, Globe, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const APP_URL = "https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus";

const values = [
  { icon: Shield, title: "Your Patients' Trust, Protected", description: "One data slip can wreck a clinic's reputation. We lock patient records down tight, so that's never something you have to worry about." },
  { icon: Zap, title: "Always On, Every Shift", description: "A system that goes down mid-appointment costs you money and trust. Clinexus stays up 99.9% of the time, so your day never stalls." },
  { icon: Lightbulb, title: "We Keep Getting Better", description: "You shouldn't have to switch platforms as your clinic grows. We add what clinic owners ask for, every month, at no extra cost to you." },
  { icon: Heart, title: "Made for Clinics, Not Offices", description: "No generic business software here. Every screen is built around how a real clinic runs, from the front desk to the treatment room." },
];

const stats = [
  { value: "500+", label: "Clinics Trust Us" },
  { value: "1.2M+", label: "Patients Managed" },
  { value: "99.9%", label: "Uptime Guarantee" },
  { value: "15+", label: "Specialties Supported" },
];

const pillars = [
  {
    icon: Target,
    title: "Our Mission",
    description: "Every Nigerian clinic deserves to run without chaos, whether you're a solo practitioner or a multi-department facility. We give you one system to handle it all, so you can focus on patients, not paperwork.",
  },
  {
    icon: Globe,
    title: "Our Vision",
    description: "No clinic should lose money, patient records, or precious hours to admin chaos. We're building the tools that let any clinic in Africa run like a world-class one.",
  },
  {
    icon: Award,
    title: "Our Commitment",
    description: "We listen to clinic owners first. Every feature comes from real conversations, every update is tested against real clinic days. We don't ship theory, we ship what actually works for you.",
  },
];

const whyUs = [
"Built around Nigerian billing and healthcare rules, no awkward workarounds",
"Get set up and live in under 24 hours, no headaches",
"Your data stays on Nigerian servers, always",
"Real people to help you get started and stay supported",
"New features added regularly, at no extra cost to you",
"Grows with you, from one room to a multi-branch clinic",
];

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <PageHero
        eyebrow="About Clinexus"
        title="We help you run a calmer, more profitable clinic."
        description="Clinexus is Nigeria's dedicated clinic management platform, built to end the daily chaos and give you back control, and your evenings."
        primaryCta={{ label: "Get Started", href: APP_URL, external: true }}
        points={[
          { value: "500+", label: "Clinics trust us" },
          { value: "1.2M+", label: "Patients managed" },
          { value: "99.9%", label: "Uptime guarantee" },
        ]}
      />

      {/* Story */}
      <section className="relative site-section-light overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-background" />
        <div className="container relative z-10">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-primary">Our Story</span>
              <h2 className="mb-6 text-3xl font-bold text-foreground leading-tight">We Saw the Chaos.<br />We Built the Fix.</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Clinexus started when our founders, a software engineer and a practicing physician, spent a weekend watching a busy clinic owner juggle 6 different tools just to see one patient. WhatsApp for reminders. Excel for billing. Paper files for records. A notebook for inventory.
              </p>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                They asked a simple question: <strong className="text-foreground">Why isn't there ONE system that handles everything a clinic needs?</strong> Not a stripped-down hospital system. Not a generic business tool with medical labels slapped on. Something built for how clinics actually run in Nigeria.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                Today, over 500 clinics run on Clinexus, cutting admin work by 60%, cutting no-shows by 40%, and getting hours of their week back that used to disappear into paperwork.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="rounded-2xl border border-border/60 bg-card p-8">
                <h3 className="mb-6 text-lg font-bold text-foreground">Why Clinics Choose Clinexus</h3>
                <ul className="space-y-3">
                  {whyUs.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 border-t border-border pt-6">
                  <a href={APP_URL}>
                    <Button className="gap-2 rounded-xl bg-primary text-primary-foreground shadow hover:opacity-90">
                      See How It Works <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative overflow-hidden bg-[hsl(var(--medical-blue-dark))] py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />
        <div className="container relative z-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="site-figure text-5xl font-semibold tabular-nums">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-medium text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission / Vision / Commitment */}
      <section className="relative site-section-tint overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-background" />
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-14 text-center">
            <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-primary">What Drives Us</span>
            <h2 className="text-3xl font-bold text-foreground">Why We Do This</h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-transform hover:-translate-y-1"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <p.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-foreground">{p.title}</h3>
                <p className="leading-relaxed text-muted-foreground text-sm">{p.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative overflow-hidden bg-[hsl(var(--medical-blue-dark))] py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.1),transparent_60%)]" />
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-14 text-center">
            <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-[hsl(var(--medical-teal))]">Our Values</span>
            <h2 className="text-3xl font-bold text-white">What You Can Count On</h2>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/8"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-muted/20">
                  <v.icon className="h-5 w-5 text-[hsl(var(--medical-teal))]" />
                </div>
                <h4 className="mb-2 font-semibold text-white">{v.title}</h4>
                <p className="text-sm leading-relaxed text-white/50">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative site-section-light overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-background" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-12 text-center"
          >
            <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-primary">Get Started</span>
            <h2 className="mb-4 text-3xl font-extrabold text-foreground">Ready for Fewer Headaches and More Revenue?</h2>
            <p className="mb-8 text-muted-foreground">
              Join 500+ clinics already saving time, cutting errors, and growing revenue with Clinexus.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href={APP_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2 rounded-md bg-primary px-8 text-primary-foreground shadow-md hover:opacity-90">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href={APP_URL}>
                <Button size="lg" variant="outline" className="rounded-md px-8">
                  Book a Demo
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
