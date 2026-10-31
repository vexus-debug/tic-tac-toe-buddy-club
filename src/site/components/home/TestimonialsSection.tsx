import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "I used to spend my evenings doing billing. Now it's done before I leave the chair. I actually have dinner with my family now.",
    name: "Dr. Adebayo Ogundimu",
    role: "Practice Owner",
    clinic: "Smile Perfect Dental",
    rating: 5,
  },
  {
    quote: "We stopped losing lab work. Every case is tracked, every technician knows what's due. We've never had a missed delivery since.",
    name: "Dr. Funke Adeyemi",
    role: "Clinical Director",
    clinic: "Premier Dental Centre",
    rating: 5,
  },
  {
    quote: "My revenue went up 23% in three months, not because I saw more patients, but because I stopped letting money fall through the cracks.",
    name: "Dr. Chinedu Obi",
    role: "Managing Partner",
    clinic: "Ivory Gate Dental Group",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="relative site-band-mesh overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-background" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-primary">
            Real Results
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Clinic Owners Who Got Their Lives Back
          </h2>
          <p className="text-muted-foreground">
            Not feature reviews. Real clinic owners whose businesses, and evenings, actually changed.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group relative rounded-2xl border border-border/50 bg-card/60 p-7 backdrop-blur-sm transition-colors duration-300 hover:border-primary/20"
            >
              <Quote className="mb-4 h-8 w-8 text-primary/20" />
              
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">"{t.quote}"</p>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role} · {t.clinic}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
