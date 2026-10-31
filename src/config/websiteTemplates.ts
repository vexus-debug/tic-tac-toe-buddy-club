export type HeroVariant =
  | "centered"
  | "split"
  | "image-full"
  | "minimal"
  | "bold-left"
  | "gradient"
  | "card"
  | "dark"
  | "editorial"
  | "wave";

export type SectionKey = "booking" | "gallery" | "doctors" | "services" | "reviews" | "hours" | "contact" | "certs";

export interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  dark: boolean;
  hero: HeroVariant;
  radius: string;
  font: string;
  headingFont: string;
  colors: {
    primary: string;
    accent: string;
    bg: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    heroBg: string;
  };
  sections: SectionKey[];
}

const ALL: SectionKey[] = ["booking", "services", "gallery", "doctors", "reviews", "hours", "contact", "certs"];

export const websiteTemplates: WebsiteTemplate[] = [
  {
    id: "classic-blue",
    name: "Classic Blue",
    description: "Clean, trustworthy clinical layout with centered hero and booking first.",
    tags: ["Clean", "Trusted", "Family"],
    dark: false,
    hero: "centered",
    radius: "0.75rem",
    font: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    colors: { primary: "#2563eb", accent: "#1d4ed8", bg: "#ffffff", surface: "#ffffff", text: "#111827", muted: "#6b7280", border: "#e5e7eb", heroBg: "#ffffff" },
    sections: ALL,
  },
  {
    id: "mint-fresh",
    name: "Mint Fresh",
    description: "Bright mint & teal palette with split hero — great for family dentistry.",
    tags: ["Fresh", "Split hero", "Friendly"],
    dark: false,
    hero: "split",
    radius: "1.25rem",
    font: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    colors: { primary: "#0d9488", accent: "#14b8a6", bg: "#f7fdfc", surface: "#ffffff", text: "#0f2f2c", muted: "#5b7b78", border: "#d7ece9", heroBg: "#ecfdf9" },
    sections: ["services", "booking", "gallery", "doctors", "reviews", "hours", "contact", "certs"],
  },
  {
    id: "midnight-lux",
    name: "Midnight Lux",
    description: "Dark, premium aesthetic with gold accents for cosmetic dentistry.",
    tags: ["Dark", "Premium", "Cosmetic"],
    dark: true,
    hero: "dark",
    radius: "0.5rem",
    font: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    colors: { primary: "#c9a227", accent: "#e5c766", bg: "#0b0f16", surface: "#141a24", text: "#f5f6f8", muted: "#9aa4b2", border: "#232c39", heroBg: "#0b0f16" },
    sections: ["gallery", "services", "booking", "doctors", "reviews", "hours", "contact", "certs"],
  },
  {
    id: "smile-studio",
    name: "Smile Studio",
    description: "Full-bleed hero image with overlay — image-forward cosmetic studio look.",
    tags: ["Image hero", "Studio", "Bold"],
    dark: false,
    hero: "image-full",
    radius: "0.25rem",
    font: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    colors: { primary: "#111827", accent: "#e11d48", bg: "#ffffff", surface: "#fafafa", text: "#0a0a0a", muted: "#71717a", border: "#e4e4e7", heroBg: "#111827" },
    sections: ["gallery", "booking", "services", "doctors", "reviews", "contact", "hours", "certs"],
  },
  {
    id: "minimal-white",
    name: "Minimal White",
    description: "Editorial minimalism, lots of whitespace, thin rules, no shadows.",
    tags: ["Minimal", "Editorial", "Quiet"],
    dark: false,
    hero: "minimal",
    radius: "0rem",
    font: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    colors: { primary: "#18181b", accent: "#52525b", bg: "#ffffff", surface: "#ffffff", text: "#18181b", muted: "#8b8b93", border: "#ebebed", heroBg: "#ffffff" },
    sections: ["services", "doctors", "booking", "gallery", "hours", "reviews", "contact", "certs"],
  },
  {
    id: "coral-care",
    name: "Coral Care",
    description: "Warm coral gradient hero, rounded cards — welcoming pediatric feel.",
    tags: ["Warm", "Gradient", "Pediatric"],
    dark: false,
    hero: "gradient",
    radius: "1.5rem",
    font: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    colors: { primary: "#f97316", accent: "#fb7185", bg: "#fffaf6", surface: "#ffffff", text: "#3b2416", muted: "#8a6f5e", border: "#f3e2d6", heroBg: "#fff1e6" },
    sections: ["booking", "gallery", "services", "doctors", "reviews", "hours", "contact", "certs"],
  },
  {
    id: "sapphire-pro",
    name: "Sapphire Pro",
    description: "Corporate multi-location look with bold left hero and service grid.",
    tags: ["Corporate", "Left hero", "Grid"],
    dark: false,
    hero: "bold-left",
    radius: "0.5rem",
    font: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    colors: { primary: "#1e3a8a", accent: "#3b82f6", bg: "#f8fafc", surface: "#ffffff", text: "#0f172a", muted: "#64748b", border: "#e2e8f0", heroBg: "#eef4ff" },
    sections: ["services", "booking", "doctors", "gallery", "hours", "reviews", "contact", "certs"],
  },
  {
    id: "orchid-aesthetic",
    name: "Orchid Aesthetic",
    description: "Soft violet card hero for aesthetic and orthodontic practices.",
    tags: ["Soft", "Card hero", "Aesthetic"],
    dark: false,
    hero: "card",
    radius: "1rem",
    font: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    colors: { primary: "#7c3aed", accent: "#a855f7", bg: "#fbfaff", surface: "#ffffff", text: "#1f1b2e", muted: "#726b85", border: "#e9e4f7", heroBg: "#f3eeff" },
    sections: ["booking", "services", "gallery", "reviews", "doctors", "hours", "contact", "certs"],
  },
  {
    id: "forest-calm",
    name: "Forest Calm",
    description: "Earthy green, wave-shaped hero — calm, holistic dental care.",
    tags: ["Earthy", "Calm", "Holistic"],
    dark: false,
    hero: "wave",
    radius: "1rem",
    font: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    colors: { primary: "#166534", accent: "#65a30d", bg: "#f8faf6", surface: "#ffffff", text: "#14251a", muted: "#5f7266", border: "#dde8dc", heroBg: "#eaf5e6" },
    sections: ["services", "gallery", "booking", "doctors", "hours", "reviews", "contact", "certs"],
  },
  {
    id: "graphite-editorial",
    name: "Graphite Editorial",
    description: "Magazine-style typography, large numbers, editorial hero.",
    tags: ["Typography", "Magazine", "Modern"],
    dark: false,
    hero: "editorial",
    radius: "0.25rem",
    font: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    colors: { primary: "#0f766e", accent: "#111827", bg: "#f5f5f4", surface: "#ffffff", text: "#1c1917", muted: "#78716c", border: "#e7e5e4", heroBg: "#ffffff" },
    sections: ["services", "doctors", "gallery", "booking", "reviews", "hours", "contact", "certs"],
  },
  {
    id: "ocean-wave",
    name: "Ocean Wave",
    description: "Cyan-to-indigo gradient hero with glassy cards and stat band.",
    tags: ["Gradient", "Glass", "Modern"],
    dark: false,
    hero: "gradient",
    radius: "1.25rem",
    font: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    colors: { primary: "#0891b2", accent: "#4f46e5", bg: "#f7fbff", surface: "#ffffff", text: "#0c1b2a", muted: "#5c7284", border: "#dceaf5", heroBg: "#e6f6fd" },
    sections: ["booking", "services", "doctors", "gallery", "reviews", "contact", "hours", "certs"],
  },
];

export const defaultTemplateId = "classic-blue";

export function getTemplate(id?: string | null): WebsiteTemplate {
  return websiteTemplates.find((t) => t.id === id) || websiteTemplates[0];
}
