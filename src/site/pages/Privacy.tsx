import Layout from "@/site/components/Layout";
import { LegalHero } from "@/site/components/heroes";
import { motion } from "framer-motion";

const sections = [
  { title: "1. Information We Collect", content: "We collect information you provide when creating an account (name, email, clinic name, phone number), as well as usage data such as pages visited, features used, and device information. Patient data entered into Clinexus is stored securely and remains owned entirely by your clinic. We never access patient records without your explicit authorization." },
  { title: "2. How We Use Your Information", content: "We use your information to provide and improve Clinexus services, communicate with you about your account, send product updates, and ensure security and compliance. We do not sell, rent, or share your data with third parties for marketing purposes. Period." },
  { title: "3. Data Security", content: "All data is encrypted in transit (TLS 1.3) and at rest using industry-standard 256-bit AES encryption. We employ role-based access controls, regular penetration testing, and multi-tenant architecture that ensures complete data isolation between clinics. Your patients' data never mingles with another clinic's." },
  { title: "4. Data Retention", content: "We retain your data for as long as your account is active. Upon account deletion, all associated data, including patient records, billing data, and files, is permanently and irreversibly removed within 30 days, unless retention is required by applicable law." },
  { title: "5. Your Rights", content: "You have the right to access, modify, export, or delete your data at any time through your dashboard or by contacting us. We support full data portability, you can export your entire dataset in standard formats (CSV, JSON) at any time." },
  { title: "6. Cookies & Tracking", content: "We use essential cookies for authentication and session management. Analytics cookies help us understand feature usage to improve the product, these are optional and can be disabled in your browser settings or through our cookie consent banner." },
  { title: "7. Third-Party Services", content: "We use select third-party services for payment processing, email delivery, and infrastructure hosting. All third-party providers are vetted for security compliance and are contractually bound to protect your data." },
  { title: "8. Data Breach Notification", content: "In the unlikely event of a data breach, we will notify affected users within 72 hours, in compliance with applicable data protection regulations. We maintain an incident response plan that is tested and updated regularly." },
  { title: "9. Contact", content: "For privacy-related inquiries, contact us at privacy@clinexus.com. We aim to respond to all privacy requests within 48 hours." },
];

const Privacy = () => {
  return (
    <Layout>
      {/* Hero */}
      <LegalHero
        kind="Privacy policy"
        updated="February 2026"
        title="Your patients' data, protected like it's our own."
        description="This policy explains exactly what we collect, how we use it, and the measures we take to protect it."
        points={[
          { value: "256-bit", label: "AES encryption at rest, TLS 1.3 in transit" },
          { value: "72 hrs", label: "Breach notification commitment" },
          { value: "100%", label: "Of your clinic's data owned by you" },
        ]}
      />

      {/* Content */}
      <section className="relative site-section-light overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-background" />
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl space-y-10">
            <p className="rounded-2xl border border-border/50 bg-card/80 p-6 text-sm leading-relaxed text-muted-foreground backdrop-blur-sm">
              Your trust is everything. As a healthcare platform, we understand the sensitivity of the data you entrust to us. This policy explains exactly what we collect, how we use it, and the measures we take to protect it.
            </p>
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="space-y-3"
              >
                <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                <p className="leading-relaxed text-muted-foreground">{section.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
