import { motion } from "framer-motion";

const stats = [
  { value: "500+", label: "Clinics Like Yours, Running Without the Chaos" },
  { value: "40%", label: "Fewer Patients Who Never Show Up" },
  { value: "60%", label: "Less Time Buried in Admin" },
  { value: "₦4.8M", label: "Avg. Monthly Revenue You Could Be Tracking" },
];

const StatsSection = () => {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0 bg-background" />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-extrabold text-primary md:text-5xl">{s.value}</div>
              <div className="mt-2 text-sm font-medium text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
