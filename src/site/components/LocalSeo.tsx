import { MapPin, Phone, Star } from "lucide-react";

export const BUSINESS_NAME = "Clinexus";
export const BUSINESS_CITY = "Lagos";
export const BUSINESS_REGION = "Lagos State";
export const BUSINESS_COUNTRY = "Nigeria";
// Replace with your real Google Business Profile link once the profile is live.
export const GOOGLE_BUSINESS_URL =
  "https://www.google.com/maps/search/?api=1&query=Clinexus+Lagos+Nigeria";

const MAP_EMBED_SRC = "https://www.google.com/maps?q=Lagos,%20Nigeria&output=embed";

type Props = {
  /** e.g. "Eye clinics" */
  specialty: string;
};

export function LocalSeo({ specialty }: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BUSINESS_NAME,
    description: `${specialty} management software for clinics in ${BUSINESS_CITY}, ${BUSINESS_COUNTRY}.`,
    areaServed: [
      { "@type": "City", name: BUSINESS_CITY },
      { "@type": "Country", name: BUSINESS_COUNTRY },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: BUSINESS_CITY,
      addressRegion: BUSINESS_REGION,
      addressCountry: "NG",
    },
    url: "https://clinexus.com.ng/",
    hasMap: GOOGLE_BUSINESS_URL,
    sameAs: [GOOGLE_BUSINESS_URL],
  };

  return (
    <section className="mt-24 rounded-3xl border border-primary/20 bg-card p-8 md:p-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
        Serving clinics locally
      </p>
      <h2 className="mb-4 text-3xl font-bold text-card-foreground">
        {specialty} in {BUSINESS_CITY}, {BUSINESS_COUNTRY}
      </h2>
      <p className="mb-8 max-w-2xl leading-relaxed text-muted-foreground">
        {BUSINESS_NAME} supports {specialty.toLowerCase()} across {BUSINESS_CITY} and every state in{" "}
        {BUSINESS_COUNTRY}, with onboarding, staff training and support in your time zone.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <p className="flex items-start gap-3 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              {BUSINESS_CITY}, {BUSINESS_REGION}, {BUSINESS_COUNTRY}
            </span>
          </p>
          <p className="flex items-start gap-3 text-sm text-muted-foreground">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Support in English, West Africa Time (GMT+1)</span>
          </p>
          <a
            href={GOOGLE_BUSINESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-primary px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
          >
            <Star className="h-4 w-4" />
            View us on Google
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          <iframe
            title={`${BUSINESS_NAME} location in ${BUSINESS_CITY}, ${BUSINESS_COUNTRY}`}
            src={MAP_EMBED_SRC}
            width="100%"
            height="260"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ border: 0 }}
          />
        </div>
      </div>
    </section>
  );
}

export default LocalSeo;
