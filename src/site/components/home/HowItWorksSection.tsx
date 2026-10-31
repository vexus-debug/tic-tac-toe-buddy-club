import { motion, useReducedMotion } from "framer-motion";

const acts = [
  {
    time: "07:45",
    title: "Before anyone takes a seat",
    line: "The front desk opens to today's list already confirmed, reminders already sent and the waiting room queue updating itself as patients walk in.",
    outcome: "Fewer empty chairs. Chasing patients is automatic, not a morning phone ritual.",
  },
  {
    time: "10:20",
    title: "In the chair",
    line: "The dentist opens the tooth chart, records findings at the chairside and adds them to the treatment plan with the catalog price already attached. Consent is signed in the room, on screen.",
    outcome: "No memo pads, no guessing prices, no second visit just to finish the notes.",
  },
  {
    time: "16:40",
    title: "After the last patient leaves",
    line: "Finishing the visit closes the loop: billables reviewed, the prescription attached, the invoice lands in billing and the crown case is dispatched to the lab with a due date everyone can see.",
    outcome: "The day's work becomes the day's revenue, with nothing left in a drawer.",
  },
];

const HowItWorksSection = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section className="site-band-porcelain py-20 md:py-28">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-4"
          >
            <h2 className="max-w-sm text-3xl text-foreground md:text-4xl">
              One day in your practice, without the workarounds.
            </h2>
            <p className="mt-5 max-w-sm leading-relaxed text-muted-foreground">
              This is a single Tuesday in a Clinexus dental practice. The eye care, laboratory and general practice systems run the same way: on their own clinical rails.
            </p>
          </motion.header>

          <ol className="relative lg:col-span-8">
            {acts.map((act, index) => (
              <motion.li
                key={act.time}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: reduceMotion ? 0 : index * 0.08 }}
                className="relative grid grid-cols-[4.5rem_1fr] gap-4 border-b border-border/30 py-8 md:grid-cols-[7rem_1fr] md:gap-8 md:py-10 last:border-b-0"
              >
                <div className="pt-1">
                  <span className="font-mono text-sm tabular-nums text-primary md:text-base">{act.time}</span>
                </div>
                <div className="border-l border-border/40 pl-6 md:pl-8">
                  <h3 className="text-xl text-foreground md:text-2xl">{act.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {act.line}
                  </p>
                  <p className="mt-4 max-w-xl text-sm font-medium text-foreground/80">
                    {act.outcome}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
