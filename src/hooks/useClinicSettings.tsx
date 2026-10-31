import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export interface OperatingHour {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export interface Certification {
  title: string;
  description?: string;
}

export interface GalleryItem {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
}

export interface WhyChooseItem {
  title: string;
  description?: string;
}

export interface TestimonialItem {
  name: string;
  text: string;
  rating?: number;
  photo_url?: string;
}

export interface PricingItem {
  name: string;
  price: string;
  note?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ServiceCard {
  title: string;
  description?: string;
  icon?: string;
}

export interface SiteSettings {
  // Template
  template?: string;

  // Identity
  welcome_text?: string;
  short_description?: string;

  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  hero_video_url?: string;
  hero_cta_label?: string;
  hero_cta_type?: "booking" | "whatsapp" | "call";
  hero_eyebrow?: string;
  hero_highlight?: string;
  hero_badge_title?: string;
  hero_badge_subtitle?: string;

  // About section (one-page layout)
  about_eyebrow?: string;
  about_title?: string;
  about_body?: string;
  about_body_2?: string;
  about_highlight_title?: string;
  about_highlight_subtitle?: string;

  // Services & booking section
  booking_eyebrow?: string;
  booking_section_title?: string;
  booking_section_subtitle?: string;

  // Reviews section
  reviews_eyebrow?: string;
  reviews_title?: string;

  // Visit section
  visit_eyebrow?: string;
  visit_title?: string;
  visit_subtitle?: string;

  // Colors
  primary_color?: string;
  accent_color?: string;

  // Contact
  whatsapp_number?: string;

  // Operating hours
  operating_hours?: OperatingHour[];

  // Social links
  instagram_url?: string;
  facebook_url?: string;
  google_review_url?: string;

  // Certifications
  certifications?: Certification[];

  // Trust bar
  trust_years?: string;
  trust_patients?: string;
  trust_rating?: string;
  trust_extra_label?: string;
  trust_extra_value?: string;
  show_trust_bar?: boolean;

  // Services overview
  service_cards?: ServiceCard[];
  services_title?: string;
  services_subtitle?: string;

  // Why choose us
  why_title?: string;
  why_items?: WhyChooseItem[];

  // Meet the dentist
  dentist_name?: string;
  dentist_credentials?: string;
  dentist_photo_url?: string;
  dentist_bio?: string;

  // Testimonials
  testimonials?: TestimonialItem[];

  // Pricing / what to expect
  pricing_title?: string;
  pricing_note?: string;
  pricing_items?: PricingItem[];
  what_to_expect?: string;

  // FAQ
  faqs?: FaqItem[];

  // Location
  map_embed_url?: string;
  directions_url?: string;

  // Final CTA
  final_cta_title?: string;
  final_cta_subtitle?: string;
  final_cta_label?: string;

  // Footer
  footer_note?: string;

  // Booking
  booking_confirmation_message?: string;

  // Gallery
  gallery_items?: GalleryItem[];
}

export interface ClinicSettings {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  clinic_type: string;
  logo_url: string | null;
  settings: SiteSettings | null;
  slug: string;
}

export function useClinicSettings() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["clinic-settings", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, address, phone, email, clinic_type, logo_url, settings, slug")
        .eq("id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as ClinicSettings | null;
    },
  });
}

export function useUpdateClinicSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; name?: string; address?: string; phone?: string; email?: string; logo_url?: string; settings?: SiteSettings }) => {
      const { id, settings: siteSettings, ...rest } = updates;
      const payload: Record<string, any> = { ...rest };
      if (siteSettings !== undefined) {
        payload.settings = siteSettings;
      }
      const { error } = await supabase.from("organizations").update(payload as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-settings"] });
      toast({ title: "Clinic settings saved" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
