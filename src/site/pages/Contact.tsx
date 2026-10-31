import Layout from "@/site/components/Layout";
import { ContactHero } from "@/site/components/heroes";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, MessageSquare, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", clinic: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
    setForm({ name: "", email: "", clinic: "", message: "" });
  };

  return (
    <Layout>
      {/* Hero */}
      <ContactHero
        title="Tell us what's slowing your clinic down."
        description="Want a demo, have questions, or need something specific? Our team is ready to help you get your time and money back."
        channels={[
          { label: "WhatsApp", value: "0901 7758 165", href: "https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus" },
          { label: "Email", value: "support@clinexus.com.ng", href: "mailto:support@clinexus.com.ng" },
          { label: "Office", value: "Ikeja, Lagos, Nigeria" },
          { label: "Hours", value: "Mon – Fri, 8am – 6pm WAT" },
        ]}
        points={[
          { value: "24 hrs", label: "Response time on every message" },
          { value: "30 min", label: "Walkthrough when you ask for a demo" },
        ]}
      />

      {/* Form + Info */}
      <section className="relative site-section-light overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-background" />

        <div className="container relative z-10">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-5 rounded-2xl border border-border/50 bg-card/80 p-8 backdrop-blur-sm"
            >
              <h3 className="text-xl font-bold text-foreground">Send Us a Message</h3>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Adebayo Ogunleye" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="doctor@yourclinic.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic">Clinic Name & Specialty</Label>
                <Input id="clinic" value={form.clinic} onChange={(e) => setForm({ ...form, clinic: e.target.value })} placeholder="e.g. Sunrise Dental Clinic" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what's slowing your clinic down, or request a personalized demo..." rows={5} />
              </div>
              <Button type="submit" className="w-full gap-2 rounded-md bg-primary text-white shadow-md hover:opacity-90">
                Send Message <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h3 className="mb-6 text-xl font-bold text-foreground">Get in Touch</h3>
                <div className="space-y-4">
                  {[
                    { icon: Mail, label: "support@clinexus.com.ng", href: "mailto:support@clinexus.com.ng" },
                    { icon: Phone, label: "0901 7758 165", href: "https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus" },
                    { icon: MapPin, label: "Ikeja, Lagos, Nigeria" },
                    { icon: Clock, label: "Mon, Fri, 8am, 6pm WAT" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      {"href" in item && item.href ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">{item.label}</a>
                      ) : (
                        item.label
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-muted/20 p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <h4 className="mb-2 font-semibold text-foreground">See It Running Before You Commit</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Want to see Clinexus set up for your specific specialty? Mention "demo" in your message and we'll book a personalized 30-minute walkthrough, no strings attached.
                </p>
              </div>

              <div className="rounded-2xl border border-border/50 bg-muted/20 p-6">
                <h4 className="mb-2 font-semibold text-foreground">Already a Customer?</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Need help fast? Log into your dashboard and use the in-app support chat. Average response time: under 2 hours.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
