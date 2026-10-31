import Layout from "@/site/components/Layout";
import { LegalHero } from "@/site/components/heroes";
import { motion } from "framer-motion";

const sections = [
  { title: "1. Acceptance of Terms", content: "By accessing or using Clinexus, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service. These terms apply to all users, including clinic administrators, staff, and any authorized personnel." },
  { title: "2. Description of Service", content: "Clinexus is a cloud-based clinic management platform that provides tools for patient management, appointment scheduling, billing & invoicing, inventory management, analytics, and more. The service is provided on a subscription basis with various plan tiers." },
  { title: "3. Account Responsibilities", content: "You are responsible for maintaining the security of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized access. As the account owner, you are responsible for managing staff access levels and ensuring appropriate permissions." },
  { title: "4. Data Ownership", content: "You retain full ownership of all data you enter into Clinexus, including patient records, financial data, and clinical documents. We do not claim ownership of your clinic or patient data. You grant us a limited license to process this data solely to provide the service." },
  { title: "5. Acceptable Use", content: "You agree not to use Clinexus for any unlawful purpose, to attempt to gain unauthorized access to other accounts or systems, to interfere with the service's operation, or to use the platform to store data unrelated to legitimate healthcare operations." },
  { title: "6. Payment Terms", content: "Paid plans are billed monthly or annually in Nigerian Naira (₦). Prices may change with 30 days' written notice. Annual plans that have been paid cannot be refunded for the remaining term, but monthly plans can be cancelled at any time. All fees are exclusive of applicable taxes." },
  { title: "7. Service Level", content: "We target 99.9% uptime for all paid plans. Scheduled maintenance windows will be communicated at least 48 hours in advance. In the event of unscheduled downtime exceeding our SLA, Enterprise plan customers may be eligible for service credits." },
  { title: "8. Termination", content: "You may cancel your account at any time from your dashboard settings. Upon cancellation, your data will remain accessible for 30 days to allow export. After 30 days, all data is permanently deleted. We reserve the right to suspend or terminate accounts that violate these terms." },
  { title: "9. Limitation of Liability", content: "Clinexus is provided 'as is' without warranties of any kind, express or implied. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim." },
  { title: "10. Changes to Terms", content: "We may update these terms from time to time. We will notify you of material changes via email and in-app notification at least 30 days before they take effect. Continued use of Clinexus after changes constitutes acceptance of the updated terms." },
  { title: "11. Governing Law", content: "These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved through arbitration in Lagos, Nigeria, under the Arbitration and Mediation Act." },
  { title: "12. Contact", content: "For questions about these terms, contact us at legal@clinexus.com or write to Clinexus Legal Team, Lagos, Nigeria." },
];

const Terms = () => {
  return (
    <Layout>
      {/* Hero */}
      <LegalHero
        kind="Terms of service"
        updated="February 2026"
        title="Plain-language terms, no lawyer required."
        description="These terms govern your use of Clinexus, written clearly because legal documents shouldn't need translation."
        points={[
          { value: "99.9%", label: "Uptime target on all paid plans" },
          { value: "30 days", label: "To export your data after cancellation" },
          { value: "₦", label: "Billed in Naira, monthly or annually" },
        ]}
      />

      {/* Content */}
      <section className="relative site-section-light overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-background" />
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl space-y-10">
            <p className="rounded-2xl border border-border/50 bg-card/80 p-6 text-sm leading-relaxed text-muted-foreground backdrop-blur-sm">
              These terms govern your use of Clinexus. We've written them in plain language because we believe legal documents shouldn't require a lawyer to understand.
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

export default Terms;
