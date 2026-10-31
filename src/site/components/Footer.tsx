import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe, ShieldCheck } from "lucide-react";
import clinexusLogoWhite from "@/assets/site/clinexus-logo-white.png";

const columns = [
  { title: "Solutions", links: [
    { label: "Eye clinics", to: "/industries/eye-clinics" },
    { label: "Dental clinics", to: "/industries/dental-clinics" },
    { label: "Dental clinic pricing", to: "/industries/dental-clinics/pricing" },
  ]},
  { title: "Resources", links: [
    { label: "Tutorials", to: "/tutorials" },
    { label: "Articles", to: "/articles" },
    { label: "Updates", to: "/updates" },
    { label: "All industries", to: "/industries" },
  ]},
  { title: "Company", links: [
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "Log in", to: "/login" },
  ]},
  { title: "Legal", links: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Cookie Policy", to: "/cookies" },
  ]},
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <footer className="site-footer border-t border-border bg-card text-foreground">
      <div className="container">
        <div className="flex flex-col gap-6 border-b border-border py-12 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <h3 className="text-xl font-semibold">Clinic insights, straight to your inbox</h3>
            <p className="mt-2 text-sm text-foreground/60">Practical tips on growing your practice and product news. No spam.</p>
          </div>
          {done ? (
            <p className="text-sm font-medium text-primary">Thanks — you're on the list.</p>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); if (email) setDone(true); }}
              className="flex w-full max-w-md gap-2"
            >
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="h-11 flex-1 rounded-md border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
              <button type="submit" className="inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90">
                Subscribe <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        <div className="grid gap-10 py-14 lg:grid-cols-6">
          <div className="space-y-4 lg:col-span-2">
            <img src={clinexusLogoWhite} alt="Clinexus" className="h-9" />
            <p className="max-w-xs text-sm text-foreground/60">
              Run a calmer, more profitable clinic, less admin, fewer no-shows, more time for patients.
            </p>
            <div className="space-y-1 text-sm text-foreground/60">
              <a href="mailto:support@clinexus.com.ng" className="block hover:text-foreground">support@clinexus.com.ng</a>
              <a href="https://wa.me/2349017758165" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground">0901 7758 165</a>
              <span className="block">Ikeja, Lagos, Nigeria</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:col-span-4 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title} className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    {l.to === "/login" ? (
                      <a href={l.to} className="text-sm text-foreground/60 transition-colors hover:text-foreground">{l.label}</a>
                    ) : (
                      <Link to={l.to} className="text-sm text-foreground/60 transition-colors hover:text-foreground">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border py-6 text-xs text-foreground/50 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Clinexus. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Nigeria (English)</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Secure cloud hosting</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
