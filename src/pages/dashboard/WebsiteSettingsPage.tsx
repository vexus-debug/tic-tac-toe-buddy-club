import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Plus, Trash2, ExternalLink, Upload, Image as ImageIcon,
  Globe, Palette, Clock, Share2, Shield, MessageSquare, Camera, LayoutTemplate,
  BarChart3, Sparkle, UserRound, Quote, Receipt, HelpCircle, MapPin, Megaphone,
} from "lucide-react";
import { websiteTemplates, defaultTemplateId, getTemplate } from "@/config/websiteTemplates";
import { websiteGuideSections, getGuideSection } from "@/config/websiteSettingsGuide";
import { SectionTour } from "@/components/dashboard/website/SectionTour";

const SECTION_ICONS: Record<string, typeof Globe> = {
  templates: LayoutTemplate,
  identity: Globe,
  pagecontent: Megaphone,
  gallery: Camera,
  hours: Clock,
  appearance: Palette,
  social: Share2,
  trust: Shield,
  booking: MessageSquare,
  trustbar: BarChart3,
  services: Sparkle,
  dentist: UserRound,
  testimonials: Quote,
  pricing: Receipt,
  faqs: HelpCircle,
  location: MapPin,
  finalcta: Megaphone,
};

import {
  useClinicSettings, useUpdateClinicSettings,
  type SiteSettings, type OperatingHour, type Certification, type GalleryItem,
  type ServiceCard, type WhyChooseItem, type TestimonialItem, type PricingItem, type FaqItem,
} from "@/hooks/useClinicSettings";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DEFAULT_HOURS: OperatingHour[] = [
  { day: "Monday", open: "09:00", close: "17:00" },
  { day: "Tuesday", open: "09:00", close: "17:00" },
  { day: "Wednesday", open: "09:00", close: "17:00" },
  { day: "Thursday", open: "09:00", close: "17:00" },
  { day: "Friday", open: "09:00", close: "17:00" },
  { day: "Saturday", open: "09:00", close: "13:00" },
  { day: "Sunday", open: "09:00", close: "13:00", closed: true },
];

export default function WebsiteSettingsPage() {
  const { data: clinicSettings } = useClinicSettings();
  const updateClinic = useUpdateClinicSettings();
  const heroImageRef = useRef<HTMLInputElement>(null);
  const galleryImageRef = useRef<HTMLInputElement>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const settings = clinicSettings?.settings || {};
  const isDiagnostic = (clinicSettings as any)?.clinic_type === "diagnostic";
  /** Pick diagnostics-specific wording for diagnostic centres, dental wording otherwise. */
  const dx = (diagnostic: string, dental: string) => (isDiagnostic ? diagnostic : dental);
  const sectionLabel = (id: string, label: string) =>
    isDiagnostic && id === "dentist" ? "Meet the specialist" : label;

  // Form state
  const [form, setForm] = useState<SiteSettings>({});
  const [hours, setHours] = useState<OperatingHour[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [newCert, setNewCert] = useState("");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [newGalleryTitle, setNewGalleryTitle] = useState("");
  const [newGalleryDesc, setNewGalleryDesc] = useState("");
  const [serviceCards, setServiceCards] = useState<ServiceCard[]>([]);
  const [whyItems, setWhyItems] = useState<WhyChooseItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  // Section navigation + guided tour
  const [tab, setTab] = useState<string>(websiteGuideSections[0].id);
  const [tourOpen, setTourOpen] = useState(false);
  const activeGuide = getGuideSection(tab);



  // Sync from server
  useEffect(() => {
    if (settings) {
      setHours(settings.operating_hours || DEFAULT_HOURS);
      setCerts(settings.certifications || []);
      setGallery(settings.gallery_items || []);
      setServiceCards(settings.service_cards || []);
      setWhyItems(settings.why_items || []);
      setTestimonials(settings.testimonials || []);
      setPricingItems(settings.pricing_items || []);
      setFaqs(settings.faqs || []);
    }
  }, [clinicSettings]);

  const get = (key: keyof SiteSettings) => (form[key] as string) ?? (settings as any)?.[key] ?? "";

  const set = (key: keyof SiteSettings, value: string) => setForm({ ...form, [key]: value });

  const getBool = (key: keyof SiteSettings, fallback = false) => {
    const value = (form[key] as unknown) ?? (settings as any)?.[key];
    return value === undefined || value === null ? fallback : Boolean(value);
  };

  const setBool = (key: keyof SiteSettings, value: boolean) =>
    setForm({ ...form, [key]: value } as Partial<SiteSettings>);


  const publicSiteUrl = clinicSettings?.slug
    ? `${window.location.origin}/site/${clinicSettings.slug}`
    : "";

  const handleSave = (extraFields?: Partial<SiteSettings>) => {
    if (!clinicSettings) return;
    const merged: SiteSettings = {
      ...settings,
      ...form,
      operating_hours: hours,
      certifications: certs,
      gallery_items: gallery,
      service_cards: serviceCards,
      why_items: whyItems,
      testimonials,
      pricing_items: pricingItems,
      faqs,
      ...extraFields,
    };
    updateClinic.mutate({ id: clinicSettings.id, settings: merged });
  };

  const selectedTemplate = (form.template as string) || (settings as any)?.template || defaultTemplateId;
  const templatePalette = getTemplate(selectedTemplate).colors;

  const handleSelectTemplate = (id: string) => {
    // Apply the template's palette too, otherwise previously saved colour
    // overrides keep the old theme colours on the public site.
    const palette = getTemplate(id).colors;
    setForm({ ...form, template: id, primary_color: palette.primary, accent_color: palette.accent });
    handleSave({ template: id, primary_color: palette.primary, accent_color: palette.accent });
  };



  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clinicSettings) return;
    setHeroUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${clinicSettings.id}/hero.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("clinic-logos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("clinic-logos").getPublicUrl(path);
      const heroUrl = urlData.publicUrl + "?t=" + Date.now();
      setForm({ ...form, hero_image_url: heroUrl });
      handleSave({ hero_image_url: heroUrl });
      toast({ title: "Hero image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setHeroUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clinicSettings) return;
    setGalleryUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const id = crypto.randomUUID();
      const path = `${clinicSettings.id}/gallery/${id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("clinic-logos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("clinic-logos").getPublicUrl(path);
      const imageUrl = urlData.publicUrl + "?t=" + Date.now();
      const newItem: GalleryItem = {
        id,
        image_url: imageUrl,
        title: newGalleryTitle.trim() || undefined,
        description: newGalleryDesc.trim() || undefined,
      };
      const updatedGallery = [...gallery, newItem];
      setGallery(updatedGallery);
      setNewGalleryTitle("");
      setNewGalleryDesc("");
      // Save immediately
      const merged: SiteSettings = {
        ...settings,
        ...form,
        operating_hours: hours,
        certifications: certs,
        gallery_items: updatedGallery,
      };
      updateClinic.mutate({ id: clinicSettings.id, settings: merged });
      toast({ title: "Gallery image added" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setGalleryUploading(false);
    }
  };

  const removeGalleryItem = (idx: number) => {
    const updated = gallery.filter((_, i) => i !== idx);
    setGallery(updated);
  };

  const updateHour = (idx: number, field: keyof OperatingHour, value: any) => {
    const updated = [...hours];
    (updated[idx] as any)[field] = value;
    setHours(updated);
  };

  const addCert = () => {
    if (!newCert.trim()) return;
    setCerts([...certs, { title: newCert.trim() }]);
    setNewCert("");
  };

  const removeCert = (idx: number) => {
    setCerts(certs.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Website Settings" description="Manage your public clinic website content and appearance" />

      {/* Public site link */}
      <Card className="glass-card border-secondary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Your Public Clinic Website</p>
            <p className="text-xs text-muted-foreground mt-0.5 break-all">{publicSiteUrl || "Loading..."}</p>
          </div>
          {publicSiteUrl && (
            <Button variant="outline" size="sm" className="shrink-0 border-border/50" asChild>
              <a href={publicSiteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Site
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs value={tab} onValueChange={setTab} className="grid items-start gap-6 lg:grid-cols-[250px_1fr]">
          <div className="lg:hidden">
            <Select value={tab} onValueChange={setTab}>
              <SelectTrigger className="w-full bg-muted/30 border-border/40">
                <SelectValue placeholder="Choose a section" />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {websiteGuideSections.map((s) => {
                  const Icon = SECTION_ICONS[s.id] ?? Globe;
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        {sectionLabel(s.id, s.label)}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <TabsList className="hidden h-auto w-full flex-col gap-1 rounded-xl bg-muted/40 p-2 lg:flex">
            {websiteGuideSections.map((s) => {
              const Icon = SECTION_ICONS[s.id] ?? Globe;
              return (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className="w-full justify-start gap-2 rounded-lg px-3 py-2 text-left data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-tight">{sectionLabel(s.id, s.label)}</span>
                    <span className="hidden text-[11px] font-normal leading-tight text-muted-foreground lg:block">
                      {s.navHint}
                    </span>
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>


          <div className="min-w-0 space-y-4">
            {/* What am I editing? */}
            <Card className="glass-card border-secondary/20">
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{activeGuide.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{activeGuide.blurb}</p>
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      <span className="font-medium text-foreground">Where it appears:</span> {activeGuide.appears}
                    </span>
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setTourOpen(true)}>
                  <HelpCircle className="mr-2 h-3.5 w-3.5" /> Show me how
                </Button>
              </CardContent>
            </Card>

          {/* Templates */}
          <TabsContent value="templates" className="mt-4">

            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Website Templates</CardTitle>
                <CardDescription>
                  Pick one of {websiteTemplates.length} complete {dx("clinic", "dental")} website designs. Each template changes the layout,
                  hero style, colours, typography and section order of your public site.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {websiteTemplates.map((t) => {
                    const active = selectedTemplate === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTemplate(t.id)}
                        className={`text-left rounded-xl border transition-all overflow-hidden hover:shadow-md ${active ? "border-secondary ring-2 ring-secondary/40" : "border-border/50"}`}
                      >
                        {/* Mini preview */}
                        <div className="h-28 relative" style={{ backgroundColor: t.colors.heroBg }}>
                          <div className="absolute top-0 left-0 right-0 h-5 flex items-center justify-between px-2" style={{ backgroundColor: t.colors.primary }}>
                            <div className="h-1.5 w-8 rounded-full bg-white/70" />
                            <div className="h-2 w-6 rounded-sm bg-white/80" />
                          </div>
                          <div className={`absolute inset-x-3 top-8 space-y-1.5 ${["centered", "gradient", "card", "wave", "dark"].includes(t.hero) ? "text-center" : ""}`}>
                            <div className="h-2.5 rounded" style={{ backgroundColor: t.colors.text, opacity: 0.85, width: t.hero === "editorial" ? "80%" : "60%", marginInline: ["centered", "gradient", "card", "wave", "dark"].includes(t.hero) ? "auto" : undefined }} />
                            <div className="h-1.5 rounded" style={{ backgroundColor: t.colors.muted, width: "45%", marginInline: ["centered", "gradient", "card", "wave", "dark"].includes(t.hero) ? "auto" : undefined }} />
                            <div className="h-3 w-14 rounded" style={{ backgroundColor: t.colors.primary, marginInline: ["centered", "gradient", "card", "wave", "dark"].includes(t.hero) ? "auto" : undefined }} />
                          </div>
                          <div className="absolute bottom-1.5 inset-x-3 grid grid-cols-3 gap-1.5">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="h-4 rounded" style={{ backgroundColor: t.colors.surface, border: `1px solid ${t.colors.border}` }} />
                            ))}
                          </div>
                        </div>
                        <div className="p-3 bg-card/60">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">{t.name}</p>
                            {active && <Badge className="text-[10px] bg-secondary">Active</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            {[t.colors.primary, t.colors.accent, t.colors.bg].map((col) => (
                              <span key={col} className="h-3.5 w-3.5 rounded-full border border-border/60" style={{ backgroundColor: col }} />
                            ))}
                            <span className="ml-auto text-[10px] text-muted-foreground">{t.tags[0]}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Selecting a template saves instantly. Colours set under “Appearance” override the template palette.
                </p>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Identity & Hero */}
          <TabsContent value="identity" className="mt-4 space-y-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Clinic Identity & Hero Section</CardTitle>
                <CardDescription>Configure what visitors see first</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg pt-6">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Short description of your clinic</Label>
                  <Textarea
                    className="bg-muted/30 border-border/40 min-h-[60px]"
                    placeholder={dx("A modern diagnostic centre for accurate lab, imaging and pharmacy services...", "A modern dental clinic dedicated to your smile...")}
                    value={get("short_description")}
                    onChange={(e) => set("short_description", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Main headline</Label>
                  <Input
                    className="bg-muted/30 border-border/40"
                    placeholder={dx("Results You Can Trust", "Your Smile, Our Priority")}
                    value={get("hero_title")}
                    onChange={(e) => set("hero_title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Sub-headline</Label>
                  <Input
                    className="bg-muted/30 border-border/40"
                    placeholder={dx("Accurate laboratory, imaging and pharmacy services", "Professional dental care for the whole family")}
                    value={get("hero_subtitle")}
                    onChange={(e) => set("hero_subtitle", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Background photo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-36 rounded-lg bg-muted/50 border border-border/40 flex items-center justify-center overflow-hidden">
                      {get("hero_image_url") ? (
                        <img src={get("hero_image_url")} alt="Hero" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <input ref={heroImageRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
                      <Button variant="outline" size="sm" onClick={() => heroImageRef.current?.click()} disabled={heroUploading}>
                        <Upload className="mr-2 h-3.5 w-3.5" />
                        {heroUploading ? "Uploading..." : "Upload Image"}
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-1">Recommended: 1920×800px</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Background video link (optional)</Label>
                  <Input className="bg-muted/30 border-border/40" placeholder="https://..." value={get("hero_video_url")} onChange={(e) => set("hero_video_url", e.target.value)} />
                  <p className="text-[10px] text-muted-foreground">If set, the video plays behind the headline instead of the photo.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Main button wording</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("Book a test", "Book an appointment")} value={get("hero_cta_label")} onChange={(e) => set("hero_cta_label", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">What the button does</Label>
                    <Select value={get("hero_cta_type") || "booking"} onValueChange={(v) => set("hero_cta_type", v)}>
                      <SelectTrigger className="bg-muted/30 border-border/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booking">Open the booking form</SelectItem>
                        <SelectItem value="whatsapp">Start a WhatsApp chat</SelectItem>
                        <SelectItem value="call">Call the clinic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery */}
          <TabsContent value="gallery" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Gallery</CardTitle>
                <CardDescription>Add procedure photos and clinic images shown in a masonry grid on your website</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Upload new */}
                <div className="border border-dashed border-border/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Add Gallery Image</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Title (optional)</Label>
                      <Input className="bg-muted/30 border-border/40 h-8 text-xs" placeholder={dx("e.g. Ultrasound Suite", "e.g. Teeth Whitening")} value={newGalleryTitle} onChange={(e) => setNewGalleryTitle(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description (optional)</Label>
                      <Input className="bg-muted/30 border-border/40 h-8 text-xs" placeholder="e.g. Before & after" value={newGalleryDesc} onChange={(e) => setNewGalleryDesc(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <input ref={galleryImageRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                    <Button variant="outline" size="sm" onClick={() => galleryImageRef.current?.click()} disabled={galleryUploading}>
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      {galleryUploading ? "Uploading..." : "Upload & Add"}
                    </Button>
                  </div>
                </div>

                {/* Existing gallery items */}
                {gallery.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No gallery images yet. Upload your first image above.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {gallery.map((item, i) => (
                      <div key={item.id} className="relative group rounded-lg overflow-hidden border border-border/40 bg-card/50">
                        <img src={item.image_url} alt={item.title || "Gallery"} className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeGalleryItem(i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {item.title && (
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">{item.title}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save gallery"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operating Hours */}
          <TabsContent value="hours" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Operating Hours</CardTitle>
                <CardDescription>Set your clinic's working hours</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 max-w-lg">
                {hours.map((h, i) => (
                  <div key={h.day} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-2 rounded-lg hover:bg-accent/30 transition-colors">
                    <span className="text-sm font-medium w-20 sm:w-24">{h.day}</span>
                    <Switch
                      checked={!h.closed}
                      onCheckedChange={(checked) => updateHour(i, "closed", !checked)}
                    />
                    {!h.closed ? (
                      <>
                        <Input type="time" className="min-w-0 flex-1 basis-24 sm:flex-none sm:w-28 bg-muted/30 h-8 text-xs" value={h.open} onChange={(e) => updateHour(i, "open", e.target.value)} />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input type="time" className="min-w-0 flex-1 basis-24 sm:flex-none sm:w-28 bg-muted/30 h-8 text-xs" value={h.close} onChange={(e) => updateHour(i, "close", e.target.value)} />
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Closed</span>
                    )}
                  </div>
                ))}
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20 mt-4" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save hours"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Color Theme</CardTitle>
                <CardDescription>Customize your website's brand colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Primary Color</Label>
                     <div className="flex items-center gap-2">
                      <input type="color" className="h-8 w-8 rounded border border-border/40 cursor-pointer" value={get("primary_color") || templatePalette.primary} onChange={(e) => set("primary_color", e.target.value)} />
                      <Input className="bg-muted/30 border-border/40 flex-1" value={get("primary_color") || templatePalette.primary} onChange={(e) => set("primary_color", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Accent Color</Label>
                     <div className="flex items-center gap-2">
                      <input type="color" className="h-8 w-8 rounded border border-border/40 cursor-pointer" value={get("accent_color") || templatePalette.accent} onChange={(e) => set("accent_color", e.target.value)} />
                      <Input className="bg-muted/30 border-border/40 flex-1" value={get("accent_color") || templatePalette.accent} onChange={(e) => set("accent_color", e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-border/40">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <div className="flex gap-3">
                    <div className="h-10 w-20 rounded-md" style={{ backgroundColor: get("primary_color") || templatePalette.primary }} />
                    <div className="h-10 w-20 rounded-md" style={{ backgroundColor: get("accent_color") || templatePalette.accent }} />
                    <div className="h-10 flex-1 rounded-md flex items-center justify-center text-xs font-medium text-white" style={{ backgroundColor: get("primary_color") || templatePalette.primary }}>
                      Book Now
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                    {updateClinic.isPending ? "Saving..." : "Save colours"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={updateClinic.isPending}
                    onClick={() => {
                      setForm({ ...form, primary_color: templatePalette.primary, accent_color: templatePalette.accent });
                      handleSave({ primary_color: templatePalette.primary, accent_color: templatePalette.accent });
                    }}
                  >
                    Reset to template colours
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social & Contact */}
          <TabsContent value="social" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Social Links & Contact</CardTitle>
                <CardDescription>Connect your social media and WhatsApp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg pt-6">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">WhatsApp Number</Label>
                  <Input className="bg-muted/30 border-border/40" placeholder="e.g. 2348012345678" value={get("whatsapp_number")} onChange={(e) => set("whatsapp_number", e.target.value)} />
                  <p className="text-[10px] text-muted-foreground">Include country code without + sign</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Instagram URL</Label>
                  <Input className="bg-muted/30 border-border/40" placeholder="https://instagram.com/yourclinic" value={get("instagram_url")} onChange={(e) => set("instagram_url", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Facebook URL</Label>
                  <Input className="bg-muted/30 border-border/40" placeholder="https://facebook.com/yourclinic" value={get("facebook_url")} onChange={(e) => set("facebook_url", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Google Review URL</Label>
                  <Input className="bg-muted/30 border-border/40" placeholder="https://g.page/yourclinic/review" value={get("google_review_url")} onChange={(e) => set("google_review_url", e.target.value)} />
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save contact details"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trust & Certifications */}
          <TabsContent value="trust" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Certifications & Licenses</CardTitle>
                <CardDescription>Display trust signals on your website</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 max-w-lg">
                <div className="flex gap-2">
                  <Input className="bg-muted/30 border-border/40 flex-1" placeholder="e.g. Licensed by Nigerian Medical Council" value={newCert} onChange={(e) => setNewCert(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCert()} />
                  <Button variant="outline" onClick={addCert} disabled={!newCert.trim()}>
                    <Plus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {certs.map((cert, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/50">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm">{cert.title}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeCert(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {certs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No certifications added yet</p>}
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save credentials"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking */}
          <TabsContent value="booking" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Booking Settings</CardTitle>
                <CardDescription>Customize the booking experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg pt-6">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Welcome Text (shown on website header)</Label>
                  <Textarea
                    className="bg-muted/30 border-border/40 min-h-[60px]"
                    placeholder={dx("Welcome! Book your test or check your results today.", "Welcome to our clinic! Book your appointment today.")}
                    value={get("welcome_text")}
                    onChange={(e) => set("welcome_text", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Booking Confirmation Message</Label>
                  <Textarea
                    className="bg-muted/30 border-border/40 min-h-[60px]"
                    placeholder={dx("Thank you for booking! We'll confirm your test and sample collection shortly via WhatsApp.", "Thank you for booking! We'll confirm your appointment shortly via WhatsApp.")}
                    value={get("booking_confirmation_message")}
                    onChange={(e) => set("booking_confirmation_message", e.target.value)}
                  />
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save booking messages"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Page sections (one-page layout) */}
          <TabsContent value="pagecontent" className="mt-4 space-y-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">One-Page Layout Content</CardTitle>
                <CardDescription>
                  Your site is a single scrolling page: Hero → About → Services &amp; Booking → Reviews → Visit → Footer.
                  Edit the copy for each band here. Colours and fonts still come from your chosen template.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 max-w-lg pt-6">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hero</p>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Small badge above the headline</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("Asaba's Trusted Diagnostic Centre", "Asaba's Premier Dental Clinic")} value={get("hero_eyebrow")} onChange={(e) => set("hero_eyebrow", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Second line (shown in your brand colour)</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="Personal Touch." value={get("hero_highlight")} onChange={(e) => set("hero_highlight", e.target.value)} />
                    <p className="text-[10px] text-muted-foreground">Shown under the hero title in your primary colour.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Small card on the photo — title</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("Same-day sample collection", "Same-day appointments")} value={get("hero_badge_title")} onChange={(e) => set("hero_badge_title", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Small card on the photo — subtitle</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("Walk in or book online — most results within 24 hours.", "Call or book online and we'll fit you in.")} value={get("hero_badge_subtitle")} onChange={(e) => set("hero_badge_subtitle", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About section</p>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Small label above the title (optional)</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="About us" value={get("about_eyebrow")} onChange={(e) => set("about_eyebrow", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Title</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("Diagnostics you can rely on.", "Dental excellence, redefined for Asaba.")} value={get("about_title")} onChange={(e) => set("about_title", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Paragraph 1</Label>
                    <Textarea className="bg-muted/30 border-border/40 min-h-[80px]" value={get("about_body")} onChange={(e) => set("about_body", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Paragraph 2</Label>
                    <Textarea className="bg-muted/30 border-border/40 min-h-[80px]" value={get("about_body_2")} onChange={(e) => set("about_body_2", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Highlight banner title</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="Trusted by 5,000+ patients" value={get("about_highlight_title")} onChange={(e) => set("about_highlight_title", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Highlight banner subtitle</Label>
                    <Input className="bg-muted/30 border-border/40" value={get("about_highlight_subtitle")} onChange={(e) => set("about_highlight_subtitle", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Services &amp; booking band</p>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Small label above the title (optional)</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("Tests & scans", "Our services")} value={get("booking_eyebrow")} onChange={(e) => set("booking_eyebrow", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Title</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("Select your tests & book instantly.", "Select your services & book instantly.")} value={get("booking_section_title")} onChange={(e) => set("booking_section_title", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Subtitle</Label>
                    <Textarea className="bg-muted/30 border-border/40 min-h-[60px]" value={get("booking_section_subtitle")} onChange={(e) => set("booking_section_subtitle", e.target.value)} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{dx("Tests and scans listed here come from your Treatments page, grouped by category.", "Services listed here come from your Treatments page, grouped by category.")}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reviews band</p>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Small label above the title (optional)</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="Patient stories" value={get("reviews_eyebrow")} onChange={(e) => set("reviews_eyebrow", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Title</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="What our patients say." value={get("reviews_title")} onChange={(e) => set("reviews_title", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Visit band</p>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Small label above the title (optional)</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="Location" value={get("visit_eyebrow")} onChange={(e) => set("visit_eyebrow", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Title</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("Visit our centre.", "Visit us today.")} value={get("visit_title")} onChange={(e) => set("visit_title", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Subtitle</Label>
                    <Textarea className="bg-muted/30 border-border/40 min-h-[60px]" value={get("visit_subtitle")} onChange={(e) => set("visit_subtitle", e.target.value)} />
                  </div>
                </div>

                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save page wording"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Trust bar & stats */}
          <TabsContent value="trustbar" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Trust bar & statistics</CardTitle>
                <CardDescription>The strip of numbers shown under your headline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg pt-6">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Show the trust bar</p>
                    <p className="text-xs text-muted-foreground">Turn off to hide all the numbers.</p>
                  </div>
                  <Switch checked={getBool("show_trust_bar", true)} onCheckedChange={(v) => setBool("show_trust_bar", v)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Years of experience</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="12+" value={get("trust_years")} onChange={(e) => set("trust_years", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Patients treated</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="5,000+" value={get("trust_patients")} onChange={(e) => set("trust_patients", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Rating</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="4.9" value={get("trust_rating")} onChange={(e) => set("trust_rating", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Extra figure — label</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("Result turnaround", "Same-day slots")} value={get("trust_extra_label")} onChange={(e) => set("trust_extra_label", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Extra figure — value</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="Daily" value={get("trust_extra_value")} onChange={(e) => set("trust_extra_value", e.target.value)} />
                  </div>
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save trust bar"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service highlights & why choose us */}
          <TabsContent value="services" className="mt-4 space-y-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Service highlights</CardTitle>
                <CardDescription>Short cards describing what you offer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Section title</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("Our tests & scans", "Our services")} value={get("services_title")} onChange={(e) => set("services_title", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Section subtitle</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("Lab, imaging and pharmacy under one roof", "Everything your family needs")} value={get("services_subtitle")} onChange={(e) => set("services_subtitle", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-3">
                  {serviceCards.map((item, i) => (
                    <div key={i} className="space-y-3 rounded-lg border border-border/40 bg-card/50 p-3">
                      <div className="flex items-start gap-2">
                        <Input className="bg-muted/30 border-border/40 flex-1" placeholder={dx("Full blood count", "Teeth whitening")} value={item.title || ""} onChange={(e) => setServiceCards(serviceCards.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)))} />
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => setServiceCards(serviceCards.filter((_, idx) => idx !== i))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Textarea className="bg-muted/30 border-border/40 min-h-[60px]" placeholder="One line about this service" value={item.description || ""} onChange={(e) => setServiceCards(serviceCards.map((r, idx) => (idx === i ? { ...r, description: e.target.value } : r)))} />
                    </div>
                  ))}
                  {serviceCards.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No service cards yet.</p>}
                  <Button variant="outline" size="sm" onClick={() => setServiceCards([...serviceCards, { title: "" }])}>
                    <Plus className="mr-1 h-4 w-4" /> Add service card
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Why choose us</CardTitle>
                <CardDescription>Your main selling points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2 max-w-lg">
                  <Label className="text-xs font-medium">Section title</Label>
                  <Input className="bg-muted/30 border-border/40" placeholder={dx("Why patients choose our centre", "Why patients choose us")} value={get("why_title")} onChange={(e) => set("why_title", e.target.value)} />
                </div>
                <div className="space-y-3">
                  {whyItems.map((item, i) => (
                    <div key={i} className="space-y-3 rounded-lg border border-border/40 bg-card/50 p-3">
                      <div className="flex items-start gap-2">
                        <Input className="bg-muted/30 border-border/40 flex-1" placeholder={dx("Accredited laboratory", "Painless treatment")} value={item.title || ""} onChange={(e) => setWhyItems(whyItems.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)))} />
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => setWhyItems(whyItems.filter((_, idx) => idx !== i))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Textarea className="bg-muted/30 border-border/40 min-h-[60px]" placeholder="A short explanation" value={item.description || ""} onChange={(e) => setWhyItems(whyItems.map((r, idx) => (idx === i ? { ...r, description: e.target.value } : r)))} />
                    </div>
                  ))}
                  {whyItems.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No reasons added yet.</p>}
                  <Button variant="outline" size="sm" onClick={() => setWhyItems([...whyItems, { title: "" }])}>
                    <Plus className="mr-1 h-4 w-4" /> Add reason
                  </Button>
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save section"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meet the dentist */}
          <TabsContent value="dentist" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">{dx("Meet the specialist", "Meet the dentist")}</CardTitle>
                <CardDescription>Introduce the person patients will see</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Name</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="Dr Ada Obi" value={get("dentist_name")} onChange={(e) => set("dentist_name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Credentials</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder={dx("MBBS, FMCPath", "BDS, MSc Implantology")} value={get("dentist_credentials")} onChange={(e) => set("dentist_credentials", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Photo link</Label>
                  <Input className="bg-muted/30 border-border/40" placeholder="https://..." value={get("dentist_photo_url")} onChange={(e) => set("dentist_photo_url", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Short biography</Label>
                  <Textarea className="bg-muted/30 border-border/40 min-h-[100px]" value={get("dentist_bio")} onChange={(e) => set("dentist_bio", e.target.value)} />
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : dx("Save specialist profile", "Save dentist profile")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testimonials */}
          <TabsContent value="testimonials" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Patient testimonials</CardTitle>
                <CardDescription>Quotes you add yourself, shown on your homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3">
                  {testimonials.map((item, i) => (
                    <div key={i} className="space-y-3 rounded-lg border border-border/40 bg-card/50 p-3">
                      <div className="flex flex-wrap items-start gap-2">
                        <Input className="bg-muted/30 border-border/40 min-w-[160px] flex-1" placeholder="Patient name" value={item.name || ""} onChange={(e) => setTestimonials(testimonials.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)))} />
                        <Input type="number" min={1} max={5} className="bg-muted/30 border-border/40 w-full sm:w-24" placeholder="Stars" value={item.rating ?? ""} onChange={(e) => setTestimonials(testimonials.map((r, idx) => (idx === i ? { ...r, rating: e.target.value ? Number(e.target.value) : undefined } : r)))} />
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => setTestimonials(testimonials.filter((_, idx) => idx !== i))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Textarea className="bg-muted/30 border-border/40 min-h-[70px]" placeholder="What the patient said" value={item.text || ""} onChange={(e) => setTestimonials(testimonials.map((r, idx) => (idx === i ? { ...r, text: e.target.value } : r)))} />
                    </div>
                  ))}
                  {testimonials.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No testimonials yet.</p>}
                  <Button variant="outline" size="sm" onClick={() => setTestimonials([...testimonials, { name: "", text: "" }])}>
                    <Plus className="mr-1 h-4 w-4" /> Add testimonial
                  </Button>
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save testimonials"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Price guide</CardTitle>
                <CardDescription>Indicative prices and what patients should expect</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Section title</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="Transparent pricing" value={get("pricing_title")} onChange={(e) => set("pricing_title", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Short note under the title</Label>
                    <Input className="bg-muted/30 border-border/40" placeholder="Prices are a guide only" value={get("pricing_note")} onChange={(e) => set("pricing_note", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-3">
                  {pricingItems.map((item, i) => (
                    <div key={i} className="flex flex-wrap items-start gap-2 rounded-lg border border-border/40 bg-card/50 p-3">
                      <Input className="bg-muted/30 border-border/40 min-w-[160px] flex-1" placeholder="Treatment" value={item.name || ""} onChange={(e) => setPricingItems(pricingItems.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)))} />
                      <Input className="bg-muted/30 border-border/40 w-full sm:w-36" placeholder="From ₦25,000" value={item.price || ""} onChange={(e) => setPricingItems(pricingItems.map((r, idx) => (idx === i ? { ...r, price: e.target.value } : r)))} />
                      <Input className="bg-muted/30 border-border/40 w-full sm:w-40" placeholder="Note (optional)" value={item.note || ""} onChange={(e) => setPricingItems(pricingItems.map((r, idx) => (idx === i ? { ...r, note: e.target.value } : r)))} />
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => setPricingItems(pricingItems.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {pricingItems.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No prices listed yet.</p>}
                  <Button variant="outline" size="sm" onClick={() => setPricingItems([...pricingItems, { name: "", price: "" }])}>
                    <Plus className="mr-1 h-4 w-4" /> Add price row
                  </Button>
                </div>
                <div className="space-y-2 max-w-lg">
                  <Label className="text-xs font-medium">What to expect</Label>
                  <Textarea className="bg-muted/30 border-border/40 min-h-[90px]" placeholder="Consultations, payment plans, anything affecting the final cost..." value={get("what_to_expect")} onChange={(e) => set("what_to_expect", e.target.value)} />
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save pricing"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQs */}
          <TabsContent value="faqs" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Frequently asked questions</CardTitle>
                <CardDescription>Answer what new patients ask most</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3">
                  {faqs.map((item, i) => (
                    <div key={i} className="space-y-3 rounded-lg border border-border/40 bg-card/50 p-3">
                      <div className="flex items-start gap-2">
                        <Input className="bg-muted/30 border-border/40 flex-1" placeholder="Do you accept walk-ins?" value={item.question || ""} onChange={(e) => setFaqs(faqs.map((r, idx) => (idx === i ? { ...r, question: e.target.value } : r)))} />
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Textarea className="bg-muted/30 border-border/40 min-h-[70px]" placeholder="Your answer" value={item.answer || ""} onChange={(e) => setFaqs(faqs.map((r, idx) => (idx === i ? { ...r, answer: e.target.value } : r)))} />
                    </div>
                  ))}
                  {faqs.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No questions added yet.</p>}
                  <Button variant="outline" size="sm" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}>
                    <Plus className="mr-1 h-4 w-4" /> Add question
                  </Button>
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save FAQs"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location & map */}
          <TabsContent value="location" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Location & map</CardTitle>
                <CardDescription>Help patients find you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg pt-6">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Map embed link</Label>
                  <Input className="bg-muted/30 border-border/40" placeholder="https://www.google.com/maps/embed?pb=..." value={get("map_embed_url")} onChange={(e) => set("map_embed_url", e.target.value)} />
                  <p className="text-[10px] text-muted-foreground">In Google Maps: Share → Embed a map, then copy the link inside src="...".</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Directions link</Label>
                  <Input className="bg-muted/30 border-border/40" placeholder="https://maps.app.goo.gl/..." value={get("directions_url")} onChange={(e) => set("directions_url", e.target.value)} />
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save location"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Final CTA & footer */}
          <TabsContent value="finalcta" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Final call-to-action & footer</CardTitle>
                <CardDescription>The closing invitation and your footer note</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg pt-6">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Closing title</Label>
                  <Input className="bg-muted/30 border-border/40" placeholder="Ready for a healthier smile?" value={get("final_cta_title")} onChange={(e) => set("final_cta_title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Closing subtitle</Label>
                  <Textarea className="bg-muted/30 border-border/40 min-h-[60px]" value={get("final_cta_subtitle")} onChange={(e) => set("final_cta_subtitle", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Button wording</Label>
                  <Input className="bg-muted/30 border-border/40" placeholder="Book your visit" value={get("final_cta_label")} onChange={(e) => set("final_cta_label", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Footer note</Label>
                  <Textarea className="bg-muted/30 border-border/40 min-h-[60px]" placeholder="Small print shown in the footer" value={get("footer_note")} onChange={(e) => set("footer_note", e.target.value)} />
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => handleSave()} disabled={updateClinic.isPending}>
                  {updateClinic.isPending ? "Saving..." : "Save closing section"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          </div>
        </Tabs>

        <SectionTour section={activeGuide} open={tourOpen} onOpenChange={setTourOpen} />
      </motion.div>

    </div>
  );
}
