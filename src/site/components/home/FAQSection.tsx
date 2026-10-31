import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { WHATSAPP_URL } from "@/lib/whatsapp";

const groups = [
  {
    title: "Switching & migration",
    faqs: [
      {
        q: "Will this actually save me time, or is it just more software to manage?",
        a: "Most clinic owners report saving 2–4 hours a day within the first week. Billing, scheduling, records and lab tracking happen in one place. You stop managing software and start managing your clinic.",
      },
      {
        q: "How quickly will I see a difference?",
        a: "Most clinics see fewer no shows within the first week (automated reminders kick in immediately) and cleaner billing from day one. Better cash flow, staff accountability and real profitability data compound as your team settles in.",
      },
    ],
  },
  {
    title: "Specialty tailoring",
    faqs: [
      {
        q: "Can my patients book appointments themselves?",
        a: "Yes. Your clinic gets a branded public page where patients can view your services and book directly, reducing phone calls and keeping your reception focused on in-clinic care.",
      },
    ],
  },
  {
    title: "Staff onboarding",
    faqs: [
      {
        q: "What if my staff isn't tech savvy?",
        a: "Clinexus is built to be as intuitive as a smartphone. Your receptionist, nurses and lab tech will figure it out fast. We also provide onboarding support and tutorials built right into the platform.",
      },
    ],
  },
  {
    title: "Revenue & billing",
    faqs: [
      {
        q: "What if I grow and need more from the system?",
        a: "Clinexus scales with you. Start on Starter, upgrade to Growth or Pro as your team and revenue grow. You never switch platforms, just unlock more as you need it.",
      },
    ],
  },
];

const FAQSection = () => {
  return (
    <section className="relative site-band-mesh overflow-hidden py-20 md:py-28">
      <div className="container relative z-10 grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-primary">
            Clinical & business FAQs
          </span>
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Clear answers for clinic directors and practice owners.
          </h2>
          <div className="site-hairline rounded-md bg-card p-6">
            <h3 className="mb-2 text-lg text-foreground">Prefer to see it on your own workflow?</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Schedule a 15-minute one-on-one walkthrough with a clinical specialist.
            </p>
            <Button asChild className="min-h-11">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Chat on WhatsApp
              </a>
            </Button>
          </div>
        </motion.div>

        <div className="space-y-8">
          {groups.map((g, gi) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: gi * 0.05 }}
            >
              <div className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">{g.title}</div>
              <Accordion type="single" collapsible className="space-y-2">
                {g.faqs.map((f, i) => (
                  <AccordionItem
                    key={i}
                    value={`${gi}-${i}`}
                    className="rounded-md border border-border bg-card/60 px-5 backdrop-blur-sm transition-colors data-[state=open]:border-primary"
                  >
                    <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
