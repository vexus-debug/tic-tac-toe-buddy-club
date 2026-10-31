import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type SeoConfig = {
  title: string;
  description: string;
  indexable: boolean;
};

const defaultDescription =
  "Clinexus helps clinics manage appointments, patient records, billing, labs, inventory, and growth in one secure platform.";

const publicMetadata: Record<string, Omit<SeoConfig, "indexable">> = {
  "/": {
    title: "Clinexus | Clinic Management Platform",
    description:
      "Run a calmer, more profitable clinic with Clinexus — appointments, records, billing, labs, inventory, and patient care in one platform.",
  },
  "/industries": {
    title: "Clinic Management Software in Lagos, Nigeria | Clinexus",
    description:
      "Compare Clinexus clinic management tools for dental, eye care, diagnostic and specialty practices across Lagos and Nigeria.",
  },
  "/industries/eye-clinics": {
    title: "Eye Clinic Management Software in Lagos, Nigeria | Clinexus",
    description:
      "Manage eye exams, prescriptions, lenses, diagnostics, surgery bookings, and patient records with Clinexus.",
  },
  "/industries/eye-clinics/features": {
    title: "Eye Clinic Features | Clinexus",
    description:
      "See the Clinexus features that help optometry and eye clinics manage exams, prescriptions, inventory, and follow-up care.",
  },
  "/industries/dental-clinics": {
    title: "Dental Clinic Management Software in Lagos, Nigeria | Clinexus",
    description:
      "Manage dental charts, treatment plans, recalls, billing, inventory, and patient records in one dental clinic platform.",
  },
  "/industries/dental-clinics/features": {
    title: "Dental Clinic Features | Clinexus",
    description:
      "Explore Clinexus tools for dental charting, treatment plans, recalls, billing, imaging, and clinic operations.",
  },
  "/about": {
    title: "About Clinexus | Clinic Software Team in Lagos, Nigeria",
    description:
      "Meet the Lagos-based team building Clinexus, and see why Nigerian clinics use it to cut admin work and focus on patients.",
  },
  "/contact": {
    title: "Contact Clinexus | Clinic Software Support in Lagos, Nigeria",
    description:
      "Reach the Clinexus team in Lagos by WhatsApp or email for demos, pricing and onboarding for your Nigerian clinic.",
  },
  "/login": {
    title: "Log in to Clinexus | Clinic Management Account",
    description:
      "Sign in to your Clinexus clinic workspace to manage appointments, patient records, billing, labs and inventory.",
  },
  "/privacy": {
    title: "Privacy Policy | Clinexus",
    description: "Read how Clinexus protects clinic, staff, and patient information.",
  },
  "/terms": {
    title: "Terms of Service | Clinexus",
    description: "Review the terms that govern use of the Clinexus clinic management platform.",
  },
};

const privateRoute = (pathname: string) =>
  pathname === "/signup" ||
  pathname === "/select-clinic" ||
  pathname === "/result" ||
  pathname === "/dashboard" ||
  pathname.startsWith("/dashboard/") ||
  pathname.startsWith("/clinic/") ||
  pathname === "/admin" ||
  pathname.startsWith("/admin/");

const getSeoConfig = (pathname: string): SeoConfig => {
  if (privateRoute(pathname)) {
    return {
      title: "Clinexus | Secure Clinic Workspace",
      description: defaultDescription,
      indexable: false,
    };
  }

  if (publicMetadata[pathname]) {
    return { ...publicMetadata[pathname], indexable: true };
  }

  if (pathname.startsWith("/site/")) {
    return {
      title: "Clinic Website | Clinexus",
      description:
        "Explore a clinic website powered by Clinexus, with services, patient information, and online booking.",
      indexable: true,
    };
  }

  return {
    title: "Clinexus | Clinic Management Platform",
    description: defaultDescription,
    indexable: false,
  };
};

const setMeta = (selector: string, attribute: "name" | "property", value: string, content: string) => {
  let element = document.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    element.dataset.clinexusSeo = "true";
    document.head.appendChild(element);
  }
  element.content = content;
};

export function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (
      window.location.protocol === "http:" &&
      !["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      window.location.replace(`https:${window.location.href.slice(window.location.protocol.length)}`);
      return;
    }

    const config = getSeoConfig(pathname);
    const origin = window.location.origin.replace(/^http:/, "https:");
    const canonicalUrl = `${origin}${pathname}`;

    document.title = config.title;
    setMeta('meta[name="description"]', "name", "description", config.description);
    setMeta('meta[name="robots"]', "name", "robots", config.indexable ? "index, follow" : "noindex, nofollow");
    setMeta('meta[name="googlebot"]', "name", "googlebot", config.indexable ? "index, follow" : "noindex, nofollow");
    setMeta('meta[property="og:title"]', "property", "og:title", config.title);
    setMeta('meta[property="og:description"]', "property", "og:description", config.description);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:image"]', "property", "og:image", `${origin}/clinexus-social-preview.jpg`);
    setMeta('meta[property="og:image:alt"]', "property", "og:image:alt", "Clinexus clinic management platform");
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", config.title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", config.description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", `${origin}/clinexus-social-preview.jpg`);
    setMeta('meta[name="twitter:image:alt"]', "name", "twitter:image:alt", "Clinexus clinic management platform");

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.dataset.clinexusSeo = "true";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    document.querySelector('script[data-clinexus-schema="true"]')?.remove();
    if (config.indexable) {
      const schema = document.createElement("script");
      schema.type = "application/ld+json";
      schema.dataset.clinexusSchema = "true";
      const orgId = `${origin}/#organization`;
      const siteId = `${origin}/#website`;
      schema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": orgId,
            name: "Clinexus",
            alternateName: ["Clinexus Nigeria", "Clinexus Clinic Software"],
            url: origin,
            logo: { "@type": "ImageObject", url: `${origin}/pwa-icon-512.png`, width: 512, height: 512 },
            image: `${origin}/clinexus-social-preview.jpg`,
            description: defaultDescription,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Lagos",
              addressCountry: "NG",
            },
            areaServed: "NG",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              areaServed: "NG",
              availableLanguage: ["English"],
              url: `${origin}/contact`,
            },
            sameAs: ["https://instagram.com/clinexus_ng", "https://x.com/clinexus_ng"],
          },
          {
            "@type": "WebSite",
            "@id": siteId,
            name: "Clinexus",
            url: origin,
            inLanguage: "en-NG",
            publisher: { "@id": orgId },
          },
          {
            "@type": "SoftwareApplication",
            name: "Clinexus",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: canonicalUrl,
            description: config.description,
            publisher: { "@id": orgId },
            isPartOf: { "@id": siteId },
          },
        ],
      });
      document.head.appendChild(schema);
    }
  }, [pathname]);

  return null;
}
