import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  MapPin, Phone, Mail, CheckCircle, Calendar, Star, Clock,
  ChevronDown, MessageCircle, Instagram, Facebook, ExternalLink,
  Loader2, Users, Award, ShoppingBag, Stethoscope, Navigation, Menu, X, Check,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { getTemplate, type WebsiteTemplate } from "@/config/websiteTemplates";
import type { SiteSettings as ClinicSiteSettings } from "@/hooks/useClinicSettings";
import CheckResultsSection from "@/components/public/CheckResultsSection";

type SiteSettings = ClinicSiteSettings;

interface ClinicInfo {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  clinic_type?: string | null;
  settings: SiteSettings | null;
}

interface Treatment {
  id: string;
  name: string;
  price: number;
  category: string | null;
  description: string | null;
  duration: number | null;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  specialty: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  patients?: { first_name: string; last_name: string } | null;
}

function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 26 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function PublicClinicSite() {
  const { slug } = useParams<{ slug: string }>();
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Booking form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  const bookingRef = useRef<HTMLDivElement>(null);

  const s = clinic?.settings || {};
  const isDiagnostic = clinic?.clinic_type === "diagnostic";

  /* ── Section copy: diagnostics centres vs dental clinics ── */
  const copy = isDiagnostic
    ? {
        heroSubtitle: "Accurate laboratory, imaging and pharmacy services you can trust",
        ctaLabel: "Book a Test",
        badgeTitle: "Same-day sample collection",
        badgeSubtitle: "Walk in or book online — most results within 24 hours.",
        aboutTitle: "Diagnostics you can rely on.",
        whyTitle: "Why patients choose our centre",
        bookingEyebrow: "Tests & scans",
        bookingTitle: "Select your tests & book instantly.",
        bookingSubtitle: "Choose a test or scan, pick a time — confirmation comes straight to your phone.",
        servicesGroupFallback: "Tests & Scans",
        servicesEmpty: "Tests and scans will be listed here soon.",
        bookingFormTitle: "Book your test",
        serviceLabel: "Test or scan",
        servicePlaceholder: "Select test or scan (optional)",
        staffLabel: "Preferred specialist *",
        staffPlaceholder: "Select specialist",
        bookedTitle: "Test booked!",
        bookAnother: "Book another test",
        confirmDefault: "We'll be in touch to confirm your appointment and sample collection.",
        navBooking: "Tests & Booking",
        reviewsEyebrow: "Patient stories",
        reviewsTitle: "What our patients say.",
        visitTitle: "Visit our centre.",
        visitSubtitle: "Find us, check our collection hours and plan your visit.",
        teamLabel: "Our specialists",
      }
    : {
        heroSubtitle: "Professional dental care for you and your family",
        ctaLabel: "Book Appointment",
        badgeTitle: "Same-day appointments",
        badgeSubtitle: "Call or book online and we'll fit you in.",
        aboutTitle: "Dental excellence, redefined.",
        whyTitle: "Why choose us",
        bookingEyebrow: "Our services",
        bookingTitle: "Select your services & book instantly.",
        bookingSubtitle: "Choose a treatment, pick your dentist and time — confirmation comes straight to your phone.",
        servicesGroupFallback: "Treatments",
        servicesEmpty: "Services will be listed here soon.",
        bookingFormTitle: "Book your visit",
        serviceLabel: "Service",
        servicePlaceholder: "Select service (optional)",
        staffLabel: "Doctor *",
        staffPlaceholder: "Select doctor",
        bookedTitle: "Appointment booked!",
        bookAnother: "Book another",
        confirmDefault: "We'll be in touch to confirm your appointment.",
        navBooking: "Services & Booking",
        reviewsEyebrow: "Patient stories",
        reviewsTitle: "What our patients say.",
        visitTitle: "Visit us today.",
        visitSubtitle: "Find us, check our opening hours and plan your visit.",
        teamLabel: "Our team",
      };
  const tpl: WebsiteTemplate = getTemplate(s.template);
  const c = tpl.colors;
  const primaryColor = s.primary_color || c.primary;
  const accentColor = s.accent_color || c.accent;
  const radius = tpl.radius;

  // Dark band used by the services/booking section and footer
  const darkBg = tpl.dark ? c.bg : "#151b26";
  const darkSurface = tpl.dark ? c.surface : "#1e2635";
  const darkBorder = tpl.dark ? c.border : "rgba(255,255,255,0.08)";
  const darkText = "#f5f7fa";
  const darkMuted = "rgba(245,247,250,0.62)";

  const dynamicStyles = useMemo(() => ({
    "--site-primary": primaryColor,
    "--site-accent": accentColor,
    backgroundColor: c.bg,
    color: c.text,
    fontFamily: tpl.font,
  } as React.CSSProperties), [primaryColor, accentColor, c.bg, c.text, tpl.font]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: radius,
  };
  const headingStyle: React.CSSProperties = { fontFamily: tpl.headingFont, color: c.text };
  const mutedStyle: React.CSSProperties = { color: c.muted };

  useEffect(() => {
    const handleScroll = () => setHeaderSolid(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!slug) return;
    const fetchClinic = async () => {
      const { data: org, error } = await supabase
        .from("organizations")
        .select("id, name, address, phone, email, logo_url, clinic_type, settings")
        .eq("slug", slug)
        .is("parent_org_id", null)
        .maybeSingle();

      if (error || !org) { setNotFound(true); setLoading(false); return; }
      setClinic(org as ClinicInfo);

      const [treatmentsRes, staffRes, reviewsRes] = await Promise.all([
        supabase.from("treatments").select("id, name, price, category, description, duration").eq("org_id", org.id).eq("status", "active").order("category"),
        supabase.from("staff").select("id, full_name, role, specialty").eq("org_id", org.id).eq("status", "active").in("role", ["dentist", "doctor", "hygienist", "owner"]),
        supabase.from("patient_reviews").select("id, rating, comment, created_at, patients(first_name, last_name)").eq("org_id", org.id).order("created_at", { ascending: false }).limit(6),
      ]);

      setTreatments(treatmentsRes.data || []);
      setStaff(staffRes.data || []);
      setReviews((reviewsRes.data as any) || []);
      setLoading(false);
    };
    fetchClinic();
  }, [slug]);

  const handleBook = async () => {
    if (!name || !phone || !selectedStaff || !date || !time) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setBooking(true);
    try {
      const res = await supabase.functions.invoke("public-booking", {
        body: { org_slug: slug, patient_name: name, patient_phone: phone, staff_id: selectedStaff, treatment_id: selectedTreatment || null, appointment_date: date, appointment_time: time },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message || "Booking failed");
      setBooked(true);
      toast({ title: "Appointment booked successfully!" });
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToBooking = () => scrollTo("book");

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-5xl mx-auto space-y-8 pt-20">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinic Not Found</h1>
          <p className="text-gray-500">This clinic page doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;
  const hours = s.operating_hours || [];
  const certs = s.certifications || [];
  const gallery = s.gallery_items || [];
  const whyItems = s.why_items || [];
  const serviceCards = s.service_cards || [];
  const testimonials = s.testimonials || [];
  const faqs = s.faqs || [];
  const confirmMsg = s.booking_confirmation_message || copy.confirmDefault;

  const heroTitle = s.hero_title || s.welcome_text || `Welcome to ${clinic?.name}`;
  const heroHighlight = s.hero_highlight || "";
  const heroSubtitle = s.hero_subtitle || s.short_description || copy.heroSubtitle;
  const heroEyebrow = s.hero_eyebrow || clinic?.name || "";

  const heroStats = [
    s.trust_years ? { value: s.trust_years, label: "Years in practice" } : null,
    s.trust_patients ? { value: s.trust_patients, label: "Patients treated" } : null,
    (s.trust_rating || avgRating) ? { value: `${s.trust_rating || avgRating}★`, label: "Patient rating" } : null,
    s.trust_extra_value ? { value: s.trust_extra_value, label: s.trust_extra_label || "Certified" } : null,
  ].filter(Boolean) as { value: string; label: string }[];

  const galleryImg = (i: number) => gallery[i]?.image_url;

  /* ── Grouped services for the dark booking section ── */
  const grouped = treatments.reduce<Record<string, Treatment[]>>((acc, t) => {
    const key = t.category || (isDiagnostic ? "Tests & Scans" : "Treatments");
    (acc[key] ||= []).push(t);
    return acc;
  }, {});

  const primaryCta = (full = false) => {
    const cls = `font-semibold text-base text-white shadow-lg ${full ? "w-full h-12" : "px-7 h-12"}`;
    if (s.hero_cta_type === "whatsapp" && s.whatsapp_number) {
      return (
        <Button className={`${cls} bg-green-500 hover:bg-green-600`} style={{ borderRadius: 999 }} asChild>
          <a href={`https://wa.me/${s.whatsapp_number}?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-5 w-5" /> {s.hero_cta_label || "Chat on WhatsApp"}
          </a>
        </Button>
      );
    }
    if (s.hero_cta_type === "call" && clinic?.phone) {
      return (
        <Button className={cls} style={{ backgroundColor: primaryColor, borderRadius: 999 }} asChild>
          <a href={`tel:${clinic.phone}`}><Phone className="mr-2 h-5 w-5" /> {s.hero_cta_label || "Call Now"}</a>
        </Button>
      );
    }
    return (
      <Button className={cls} style={{ backgroundColor: primaryColor, borderRadius: 999 }} onClick={scrollToBooking}>
        <Calendar className="mr-2 h-5 w-5" /> {s.hero_cta_label || copy.ctaLabel}
      </Button>
    );
  };

  const navLinks = [
    { id: "about", label: "About" },
    { id: "book", label: copy.navBooking },
    ...(isDiagnostic ? [{ id: "results", label: "Check Results" }] : []),
    { id: "reviews", label: "Reviews" },
    { id: "visit", label: "Visit" },
  ];

  return (
    <div className="min-h-screen" style={dynamicStyles}>
      {/* ───────── Sticky header ───────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: headerSolid ? hexToRgba(c.surface === "#ffffff" ? "#ffffff" : c.surface, 0.92) : "transparent",
          backdropFilter: headerSolid ? "blur(12px)" : undefined,
          borderBottom: headerSolid ? `1px solid ${c.border}` : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {clinic?.logo_url
              ? <img src={clinic.logo_url} alt={clinic?.name} className="h-9 w-9 rounded-full object-cover" />
              : <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>{clinic?.name?.[0]}</div>}
            <div className="leading-tight">
              <p className="text-sm font-bold" style={headingStyle}>{clinic?.name}</p>
              {s.short_description && <p className="text-[10px]" style={mutedStyle}>{s.short_description.slice(0, 34)}</p>}
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <button key={l.id} onClick={() => scrollTo(l.id)} className="text-sm hover:opacity-70 transition-opacity" style={mutedStyle}>{l.label}</button>
            ))}
            <Link to={`/site/${slug}/shop`} className="text-sm hover:opacity-70" style={mutedStyle}>Shop</Link>
            <Button size="sm" className="text-white font-semibold" style={{ backgroundColor: primaryColor, borderRadius: 999 }} onClick={scrollToBooking}>Book Now</Button>
          </nav>

          <button className="md:hidden p-2" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu" style={{ color: c.text }}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-1" style={{ backgroundColor: c.surface, borderBottom: `1px solid ${c.border}` }}>
            {navLinks.map((l) => (
              <button key={l.id} onClick={() => scrollTo(l.id)} className="block w-full text-left py-2.5 text-sm" style={{ color: c.text }}>{l.label}</button>
            ))}
            <Link to={`/site/${slug}/shop`} className="block py-2.5 text-sm" style={{ color: c.text }}>Shop</Link>
            <Button className="w-full mt-2 text-white font-semibold" style={{ backgroundColor: primaryColor, borderRadius: 999 }} onClick={scrollToBooking}>Book Now</Button>
          </div>
        )}
      </header>

      {/* ───────── 1. Hero ───────── */}
      <section className="pt-24 pb-14 px-4 sm:px-6" style={{ backgroundColor: c.heroBg }}>
        <div className="max-w-6xl mx-auto">
          {heroEyebrow && (
            <span className="inline-block text-[11px] font-semibold px-3 py-1.5 rounded-full mb-5" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>
              {heroEyebrow}
            </span>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight" style={headingStyle}>
            {heroTitle}
            {heroHighlight && <><br /><span style={{ color: primaryColor }}>{heroHighlight}</span></>}
          </h1>
          <p className="mt-5 text-base sm:text-lg max-w-xl leading-relaxed" style={mutedStyle}>{heroSubtitle}</p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            {primaryCta()}
            {avgRating && (
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-3.5 w-3.5" style={{ fill: k < Math.round(Number(avgRating)) ? primaryColor : "transparent", color: primaryColor }} />
                  ))}
                </div>
                <span className="text-xs font-medium" style={mutedStyle}>{avgRating} · {reviews.length} reviews</span>
              </div>
            )}
          </div>

          {heroStats.length > 0 && (
            <div className="mt-9 grid grid-cols-3 gap-4 max-w-lg" style={{ borderTop: `1px solid ${c.border}`, paddingTop: "1.5rem" }}>
              {heroStats.slice(0, 3).map((st) => (
                <div key={st.label}>
                  <p className="text-xl font-bold" style={{ ...headingStyle }}>{st.value}</p>
                  <p className="text-[11px] mt-0.5" style={mutedStyle}>{st.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Image collage */}
          <div className="mt-9 grid grid-cols-2 gap-3">
            <div className="overflow-hidden" style={{ borderRadius: `calc(${radius} * 1.5)`, backgroundColor: hexToRgba(primaryColor, 0.08), aspectRatio: "3/4" }}>
              {(galleryImg(0) || s.hero_image_url) && <img src={galleryImg(0) || s.hero_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />}
            </div>
            <div className="space-y-3">
              <div className="overflow-hidden" style={{ borderRadius: `calc(${radius} * 1.5)`, backgroundColor: hexToRgba(accentColor, 0.08), aspectRatio: "4/3" }}>
                {galleryImg(1) && <img src={galleryImg(1)} alt="" className="w-full h-full object-cover" loading="lazy" />}
              </div>
              <div className="p-4 text-white" style={{ backgroundColor: primaryColor, borderRadius: `calc(${radius} * 1.5)` }}>
                <Clock className="h-5 w-5 mb-2 opacity-90" />
                <p className="text-sm font-bold leading-tight">{s.hero_badge_title || copy.badgeTitle}</p>
                <p className="text-[11px] mt-1 opacity-80 leading-snug">{s.hero_badge_subtitle || copy.badgeSubtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── 2. About ───────── */}
      <section id="about" className="py-16 px-4 sm:px-6" style={{ backgroundColor: c.bg }}>
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            {(s.about_eyebrow || "About us") && (
              <span className="inline-block text-[11px] font-semibold px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>
                {s.about_eyebrow || "About us"}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight" style={headingStyle}>
              {s.about_title || copy.aboutTitle}
            </h2>
            {(s.about_body || s.short_description) && (
              <p className="mt-4 text-sm sm:text-base leading-relaxed whitespace-pre-line" style={mutedStyle}>{s.about_body || s.short_description}</p>
            )}
            {s.about_body_2 && <p className="mt-3 text-sm sm:text-base leading-relaxed whitespace-pre-line" style={mutedStyle}>{s.about_body_2}</p>}

            {certs.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {certs.map((cert, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full" style={{ border: `1px solid ${c.border}`, backgroundColor: c.surface, color: c.text }}>
                    <Award className="h-3.5 w-3.5" style={{ color: primaryColor }} /> {cert.title}
                  </span>
                ))}
              </div>
            )}
          </FadeInSection>

          {(galleryImg(2) || galleryImg(3)) && (
            <FadeInSection className="mt-8 grid grid-cols-2 gap-3">
              {[galleryImg(2), galleryImg(3)].map((src, i) => src ? (
                <div key={i} className="overflow-hidden" style={{ borderRadius: `calc(${radius} * 1.5)`, aspectRatio: "4/3" }}>
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : null)}
            </FadeInSection>
          )}

          {heroStats.length > 0 && (
            <FadeInSection className="mt-8 grid grid-cols-2 gap-3">
              {heroStats.map((st) => (
                <div key={st.label} className="p-5 text-center" style={cardStyle}>
                  <p className="text-2xl font-bold" style={{ color: primaryColor, fontFamily: tpl.headingFont }}>{st.value}</p>
                  <p className="text-[11px] mt-1" style={mutedStyle}>{st.label}</p>
                </div>
              ))}
            </FadeInSection>
          )}

          {(s.about_highlight_title || s.about_highlight_subtitle) && (
            <FadeInSection className="mt-6">
              <div className="p-6 text-white" style={{ backgroundColor: primaryColor, borderRadius: `calc(${radius} * 1.5)` }}>
                <p className="text-lg font-bold leading-snug">{s.about_highlight_title}</p>
                {s.about_highlight_subtitle && <p className="text-sm mt-2 opacity-85">{s.about_highlight_subtitle}</p>}
              </div>
            </FadeInSection>
          )}

          {whyItems.length > 0 && (
            <FadeInSection className="mt-6">
              <div className="p-6" style={cardStyle}>
                <h3 className="font-bold mb-4" style={headingStyle}>{s.why_title || copy.whyTitle}</h3>
                <ul className="space-y-3">
                  {whyItems.map((w, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: hexToRgba(primaryColor, 0.12) }}>
                        <Check className="h-3 w-3" style={{ color: primaryColor }} />
                      </span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: c.text }}>{w.title}</p>
                        {w.description && <p className="text-xs mt-0.5" style={mutedStyle}>{w.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInSection>
          )}

          {serviceCards.length > 0 && (
            <FadeInSection className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {serviceCards.map((sc, i) => (
                <div key={`${sc.title}-${i}`} className="p-5 h-full" style={cardStyle}>
                  <div className="h-9 w-9 flex items-center justify-center mb-3" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), borderRadius: radius }}>
                    <Stethoscope className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                  </div>
                  <p className="font-semibold text-sm" style={headingStyle}>{sc.title}</p>
                  {sc.description && <p className="text-xs mt-1" style={mutedStyle}>{sc.description}</p>}
                </div>
              ))}
            </FadeInSection>
          )}
        </div>
      </section>

      {/* ───────── 3. Dark services + booking ───────── */}
      <section id="book" ref={bookingRef} className="py-16 px-4 sm:px-6 scroll-mt-16" style={{ backgroundColor: darkBg, color: darkText }}>
        <div className="max-w-6xl mx-auto">
          <span className="inline-block text-[11px] font-semibold px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: darkMuted }}>
            {s.booking_eyebrow || copy.bookingEyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight" style={{ fontFamily: tpl.headingFont, color: darkText }}>
            {s.booking_section_title || copy.bookingTitle}
          </h2>
          <p className="mt-3 text-sm sm:text-base max-w-xl" style={{ color: darkMuted }}>
            {s.booking_section_subtitle || copy.bookingSubtitle}
          </p>

          <div className="mt-8 grid lg:grid-cols-2 gap-8 items-start">
            {/* Service list */}
            <div className="space-y-6">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <p className="text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: darkMuted }}>{category}</p>
                  <div className="space-y-2">
                    {items.map((t) => {
                      const active = selectedTreatment === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTreatment(active ? "" : t.id)}
                          className="w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-3"
                          style={{
                            backgroundColor: active ? hexToRgba(primaryColor, 0.18) : darkSurface,
                            border: `1px solid ${active ? primaryColor : darkBorder}`,
                            borderRadius: 999,
                          }}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium truncate" style={{ color: darkText }}>{t.name}</span>
                            {t.description && <span className="block text-[11px] truncate" style={{ color: darkMuted }}>{t.description}</span>}
                          </span>
                          <span className="text-xs font-semibold shrink-0" style={{ color: active ? primaryColor : darkMuted }}>
                            ₦{t.price.toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {treatments.length === 0 && <p className="text-sm" style={{ color: darkMuted }}>{copy.servicesEmpty}</p>}
            </div>

            {/* Booking form */}
            <div className="p-6 lg:sticky lg:top-24" style={{ backgroundColor: darkSurface, border: `1px solid ${darkBorder}`, borderRadius: `calc(${radius} * 1.5)` }}>
              {booked ? (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8 space-y-4">
                  <div className="h-14 w-14 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: hexToRgba(primaryColor, 0.16) }}>
                    <CheckCircle className="h-7 w-7" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: darkText, fontFamily: tpl.headingFont }}>{copy.bookedTitle}</h3>
                  <p className="text-sm max-w-sm mx-auto" style={{ color: darkMuted }}>{confirmMsg}</p>
                  <Button variant="outline" style={{ borderColor: darkBorder, color: darkText, backgroundColor: "transparent" }} onClick={() => { setBooked(false); setName(""); setPhone(""); setSelectedStaff(""); setSelectedTreatment(""); setDate(""); setTime(""); }}>
                    {copy.bookAnother}
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold" style={{ color: darkText, fontFamily: tpl.headingFont }}>{copy.bookingFormTitle}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: darkMuted }}>Full name *</label>
                      <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-white placeholder:text-white/40" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: darkBorder }} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: darkMuted }}>Phone *</label>
                      <Input placeholder="080xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 text-white placeholder:text-white/40" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: darkBorder }} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: darkMuted }}>{copy.serviceLabel}</label>
                      <Select value={selectedTreatment} onValueChange={setSelectedTreatment}>
                        <SelectTrigger className="h-11 text-white" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: darkBorder }}>
                          <SelectValue placeholder={copy.servicePlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {treatments.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name} — ₦{t.price.toLocaleString()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: darkMuted }}>{copy.staffLabel}</label>
                      <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                        <SelectTrigger className="h-11 text-white" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: darkBorder }}>
                          <SelectValue placeholder={copy.staffPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {staff.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.full_name}{m.specialty ? ` — ${m.specialty}` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: darkMuted }}>Date *</label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="h-11 text-white" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: darkBorder }} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: darkMuted }}>Time *</label>
                      <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 text-white" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: darkBorder }} />
                    </div>
                  </div>
                  <Button className="w-full h-12 text-white text-base font-semibold" style={{ backgroundColor: primaryColor, borderRadius: 999 }} onClick={handleBook} disabled={booking}>
                    {booking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</> : "Confirm booking"}
                  </Button>
                  {s.whatsapp_number && (
                    <a href={`https://wa.me/${s.whatsapp_number}?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus`} target="_blank" rel="noopener noreferrer" className="block text-center text-xs hover:underline" style={{ color: darkMuted }}>
                      Prefer WhatsApp? Message us instead
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {staff.length > 0 && (
            <div className="mt-12">
              <p className="text-[11px] uppercase tracking-[0.18em] mb-4" style={{ color: darkMuted }}>{copy.teamLabel}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {staff.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center gap-3" style={{ backgroundColor: darkSurface, border: `1px solid ${darkBorder}`, borderRadius: `calc(${radius} * 1.2)` }}>
                    <div className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                      {doc.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: darkText }}>{doc.full_name}</p>
                      <p className="text-[11px] capitalize truncate" style={{ color: darkMuted }}>{doc.specialty || doc.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {isDiagnostic && (
        <CheckResultsSection
          clinicName={clinic?.name}
          primaryColor={primaryColor}
          cardStyle={cardStyle}
          headingStyle={headingStyle}
          mutedStyle={mutedStyle}
          bg={c.bg}
        />
      )}

      {/* ───────── 4. Reviews ───────── */}
      {(reviews.length > 0 || testimonials.length > 0) && (
        <section id="reviews" className="py-16 px-4 sm:px-6 scroll-mt-16" style={{ backgroundColor: c.bg }}>
          <div className="max-w-6xl mx-auto text-center">
            <span className="inline-block text-[11px] font-semibold px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>
              {s.reviews_eyebrow || copy.reviewsEyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={headingStyle}>{s.reviews_title || copy.reviewsTitle}</h2>
            {avgRating && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-4 w-4" style={{ fill: k < Math.round(Number(avgRating)) ? primaryColor : "transparent", color: primaryColor }} />
                  ))}
                </div>
                <span className="text-sm font-semibold" style={{ color: c.text }}>{avgRating}</span>
                <span className="text-sm" style={mutedStyle}>· {reviews.length} reviews</span>
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-left">
              {reviews.map((r, i) => (
                <FadeInSection key={r.id} delay={i * 0.05}>
                  <div className="p-5 h-full" style={cardStyle}>
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, k) => (
                        <Star key={k} className="h-3.5 w-3.5" style={{ fill: k < r.rating ? primaryColor : "transparent", color: k < r.rating ? primaryColor : c.border }} />
                      ))}
                    </div>
                    {r.comment && <p className="text-sm leading-relaxed" style={{ color: c.text }}>“{r.comment}”</p>}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs font-semibold" style={{ color: c.text }}>
                        {r.patients ? `${r.patients.first_name} ${r.patients.last_name?.[0] || ""}.` : "Verified patient"}
                      </p>
                      <p className="text-[11px]" style={mutedStyle}>{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
              {testimonials.map((t, i) => (
                <FadeInSection key={`t-${i}`} delay={i * 0.05}>
                  <div className="p-5 h-full" style={cardStyle}>
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: t.rating || 5 }).map((_, k) => (
                        <Star key={k} className="h-3.5 w-3.5" style={{ fill: primaryColor, color: primaryColor }} />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: c.text }}>“{t.text}”</p>
                    <p className="text-xs font-semibold mt-4" style={{ color: c.text }}>{t.name}</p>
                  </div>
                </FadeInSection>
              ))}
            </div>

            {s.google_review_url && (
              <a href={s.google_review_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-8 text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                Read all reviews on Google <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </section>
      )}

      {/* ───────── 5. Visit us ───────── */}
      <section id="visit" className="py-16 px-4 sm:px-6 scroll-mt-16" style={{ backgroundColor: c.heroBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <span className="inline-block text-[11px] font-semibold px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>
              {s.visit_eyebrow || "Location"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={headingStyle}>{s.visit_title || copy.visitTitle}</h2>
            <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto" style={mutedStyle}>
              {s.visit_subtitle || clinic?.address || copy.visitSubtitle}
            </p>
          </div>

          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="overflow-hidden" style={cardStyle}>
                {s.map_embed_url ? (
                  <iframe src={s.map_embed_url} title="Clinic location map" className="w-full" style={{ height: 260, border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8" style={{ height: 260 }}>
                    <MapPin className="h-7 w-7 mb-3" style={{ color: primaryColor }} />
                    <p className="text-sm" style={{ color: c.text }}>{clinic?.address || "Address coming soon"}</p>
                  </div>
                )}
              </div>
              {(galleryImg(4) || galleryImg(5)) && (
                <div className="grid grid-cols-2 gap-3">
                  {[galleryImg(4), galleryImg(5)].map((src, i) => src ? (
                    <div key={i} className="overflow-hidden" style={{ borderRadius: `calc(${radius} * 1.5)`, aspectRatio: "4/3" }}>
                      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ) : null)}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {hours.length > 0 && (
                <div className="overflow-hidden" style={cardStyle}>
                  <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <Clock className="h-4 w-4" style={{ color: primaryColor }} />
                    <p className="text-sm font-semibold" style={{ color: c.text }}>Opening hours</p>
                  </div>
                  {hours.map((h, i) => {
                    const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }) === h.day;
                    return (
                      <div key={h.day} className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: i < hours.length - 1 ? `1px solid ${c.border}` : undefined, backgroundColor: isToday ? hexToRgba(primaryColor, 0.06) : undefined }}>
                        <span className="text-sm" style={{ color: isToday ? c.text : c.muted, fontWeight: isToday ? 700 : 400 }}>{h.day}</span>
                        <span className="text-sm" style={{ color: h.closed ? c.muted : c.text, fontWeight: h.closed ? 400 : 600 }}>
                          {h.closed ? "Closed" : `${h.open} – ${h.close}`}
                        </span>
                      </div>
                    );
                  })}
                  {s.directions_url && (
                    <a href={s.directions_url} target="_blank" rel="noopener noreferrer" className="block px-5 py-3 text-xs font-medium hover:underline" style={{ color: primaryColor }}>
                      Plan your route in Google Maps
                    </a>
                  )}
                </div>
              )}

              <div className="p-5 space-y-4" style={cardStyle}>
                {clinic?.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={mutedStyle}>Address</p>
                      <p className="text-sm" style={{ color: c.text }}>{clinic.address}</p>
                    </div>
                  </div>
                )}
                {clinic?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={mutedStyle}>Phone</p>
                      <a href={`tel:${clinic.phone}`} className="text-sm hover:underline" style={{ color: c.text }}>{clinic.phone}</a>
                    </div>
                  </div>
                )}
                {clinic?.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={mutedStyle}>Email</p>
                      <a href={`mailto:${clinic.email}`} className="text-sm hover:underline" style={{ color: c.text }}>{clinic.email}</a>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                {s.directions_url && (
                  <Button variant="outline" className="h-11" style={{ borderColor: c.border, color: c.text, backgroundColor: c.surface, borderRadius: 999 }} asChild>
                    <a href={s.directions_url} target="_blank" rel="noopener noreferrer"><Navigation className="mr-2 h-4 w-4" /> Get directions</a>
                  </Button>
                )}
                {s.whatsapp_number && (
                  <Button className="h-12 bg-green-500 hover:bg-green-600 text-white font-semibold" style={{ borderRadius: 999 }} asChild>
                    <a href={`https://wa.me/${s.whatsapp_number}?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus`} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-5 w-5" /> Chat on WhatsApp</a>
                  </Button>
                )}
                {clinic?.phone && (
                  <Button variant="outline" className="h-11" style={{ borderColor: c.border, color: c.text, backgroundColor: c.surface, borderRadius: 999 }} asChild>
                    <a href={`tel:${clinic.phone}`}><Phone className="mr-2 h-4 w-4" /> Call clinic</a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {faqs.length > 0 && (
            <div className="mt-10 max-w-3xl mx-auto space-y-3">
              {faqs.map((f, i) => (
                <details key={`${f.question}-${i}`} className="p-5" style={cardStyle}>
                  <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between gap-4" style={{ color: c.text }}>
                    {f.question}
                    <ChevronDown className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                  </summary>
                  <p className="text-sm mt-3 whitespace-pre-line leading-relaxed" style={mutedStyle}>{f.answer}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer style={{ backgroundColor: darkBg, color: darkText }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                {clinic?.logo_url && <img src={clinic.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />}
                <span className="font-bold" style={{ fontFamily: tpl.headingFont, color: darkText }}>{clinic?.name}</span>
              </div>
              {s.short_description && <p className="text-sm max-w-sm" style={{ color: darkMuted }}>{s.short_description}</p>}
              {galleryImg(0) && (
                <div className="mt-5 overflow-hidden max-w-sm" style={{ borderRadius: `calc(${radius} * 1.5)`, aspectRatio: "16/9" }}>
                  <img src={galleryImg(0)} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: darkMuted }}>Quick links</h4>
              {navLinks.map((l) => (
                <button key={l.id} onClick={() => scrollTo(l.id)} className="block text-sm mb-1.5 hover:underline" style={{ color: darkText }}>{l.label}</button>
              ))}
              <Link to={`/site/${slug}/shop`} className="block text-sm mb-1.5 hover:underline" style={{ color: darkText }}>
                <ShoppingBag className="inline mr-1.5 h-3.5 w-3.5" />Shop
              </Link>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: darkMuted }}>Contact</h4>
              {clinic?.phone && <p className="text-sm mb-1.5" style={{ color: darkText }}>{clinic.phone}</p>}
              {clinic?.email && <p className="text-sm mb-1.5" style={{ color: darkText }}>{clinic.email}</p>}
              {clinic?.address && <p className="text-sm mb-3" style={{ color: darkMuted }}>{clinic.address}</p>}
              <div className="flex gap-2">
                {s.instagram_url && (
                  <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <Instagram className="h-4 w-4" style={{ color: darkText }} />
                  </a>
                )}
                {s.facebook_url && (
                  <a href={s.facebook_url} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <Facebook className="h-4 w-4" style={{ color: darkText }} />
                  </a>
                )}
                {s.whatsapp_number && (
                  <a href={`https://wa.me/${s.whatsapp_number}?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus`} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <MessageCircle className="h-4 w-4" style={{ color: darkText }} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 text-center" style={{ borderTop: `1px solid ${darkBorder}` }}>
            <p className="text-xs" style={{ color: darkMuted }}>
              © {new Date().getFullYear()} {clinic?.name}. {s.footer_note || "All rights reserved."}
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      {s.whatsapp_number && (
        <a
          href={`https://wa.me/${s.whatsapp_number}?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </a>
      )}
    </div>
  );
}
