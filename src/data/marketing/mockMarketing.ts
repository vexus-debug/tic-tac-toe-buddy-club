import type {
  AudienceSegment, CampaignTemplate, ContentIdea, MarketingCampaign,
  PatientReview, Promotion, RecallSegment, Referral, SocialPost,
} from "./types";

export const audienceSegments: AudienceSegment[] = [
  { id: "seg-all", name: "All active patients", description: "Every patient seen in the last 24 months", size: 1284, tags: ["All"] },
  { id: "seg-recall", name: "Due for 6-month recall", description: "Last cleaning was 5-7 months ago", size: 216, tags: ["Recall", "Hygiene"] },
  { id: "seg-lapsed", name: "Lapsed 12+ months", description: "No visit in over a year", size: 341, tags: ["Reactivation"] },
  { id: "seg-whitening", name: "Whitening interest", description: "Viewed or asked about cosmetic treatments", size: 97, tags: ["Cosmetic"] },
  { id: "seg-kids", name: "Families with children", description: "Households with a patient under 16", size: 158, tags: ["Pediatric"] },
  { id: "seg-balance", name: "Outstanding balance", description: "Unpaid invoice older than 30 days", size: 63, tags: ["Billing"] },
  { id: "seg-birthday", name: "Birthdays this month", description: "Patients celebrating this month", size: 44, tags: ["Lifecycle"] },
];

export const emailCampaigns: MarketingCampaign[] = [
  { id: "c1", name: "Spring whitening offer", channel: "email", subject: "Brighten your smile — 20% off whitening", body: "Hi {{first_name}}, our spring whitening offer is here...", segment_id: "seg-whitening", status: "sent", sent_at: "2026-08-05T09:00:00Z", recipients: 97, delivered: 95, opened: 58, clicked: 21, unsubscribed: 1, booked: 12, revenue: 4800 },
  { id: "c2", name: "6-month checkup reminder", channel: "email", subject: "It's time for your checkup", body: "Hi {{first_name}}, it has been six months...", segment_id: "seg-recall", status: "sent", sent_at: "2026-07-28T08:30:00Z", recipients: 216, delivered: 212, opened: 141, clicked: 63, unsubscribed: 2, booked: 41, revenue: 9200 },
  { id: "c3", name: "Back to school dental check", channel: "email", subject: "Book the kids in before term starts", body: "Hi {{first_name}}, term starts soon...", segment_id: "seg-kids", status: "scheduled", scheduled_for: "2026-08-25T07:00:00Z", recipients: 158, delivered: 0, opened: 0, clicked: 0, unsubscribed: 0, booked: 0, revenue: 0 },
  { id: "c4", name: "We miss you — come back offer", channel: "email", subject: "A free consult, on us", body: "Hi {{first_name}}, we noticed it has been a while...", segment_id: "seg-lapsed", status: "draft", recipients: 341, delivered: 0, opened: 0, clicked: 0, unsubscribed: 0, booked: 0, revenue: 0 },
];

export const smsCampaigns: MarketingCampaign[] = [
  { id: "s1", name: "Tomorrow openings", channel: "sms", body: "We have two openings tomorrow at 2pm and 4pm. Reply BOOK to grab one. Txt STOP to opt out.", segment_id: "seg-recall", status: "sent", sent_at: "2026-08-18T10:15:00Z", recipients: 120, delivered: 118, opened: 0, clicked: 27, unsubscribed: 1, booked: 9, revenue: 1350 },
  { id: "s2", name: "Missed appointment follow-up", channel: "sms", body: "Hi {{first_name}}, sorry we missed you. Tap to rebook. Txt STOP to opt out.", segment_id: "seg-all", status: "sent", sent_at: "2026-08-12T16:00:00Z", recipients: 38, delivered: 38, opened: 0, clicked: 14, unsubscribed: 0, booked: 7, revenue: 980 },
  { id: "s3", name: "Birthday greeting + gift", channel: "sms", body: "Happy birthday {{first_name}}! Enjoy 15% off any treatment this month. Txt STOP to opt out.", segment_id: "seg-birthday", status: "scheduled", scheduled_for: "2026-09-01T08:00:00Z", recipients: 44, delivered: 0, opened: 0, clicked: 0, unsubscribed: 0, booked: 0, revenue: 0 },
];

export const campaignTemplates: CampaignTemplate[] = [
  { id: "t1", name: "Recall reminder", channel: "email", category: "Lifecycle", subject: "Time for your six-month checkup", body: "Hi {{first_name}},\n\nIt has been about six months since your last visit. Regular checkups keep small problems small.\n\nBook online in under a minute." },
  { id: "t2", name: "Whitening promotion", channel: "email", category: "Promotion", subject: "20% off professional whitening", body: "Hi {{first_name}},\n\nFor this month only, professional whitening is 20% off.\n\nLimited slots available." },
  { id: "t3", name: "Post-treatment care", channel: "email", category: "Care", subject: "Looking after your new filling", body: "Hi {{first_name}},\n\nHere is how to care for your treatment over the next few days." },
  { id: "t4", name: "Welcome new patient", channel: "email", category: "Lifecycle", subject: "Welcome to the practice", body: "Hi {{first_name}},\n\nWelcome! Here is what to expect at your first visit." },
  { id: "t5", name: "Waitlist opening", channel: "sms", category: "Scheduling", subject: "", body: "An earlier slot just opened: {{slot_time}}. Reply YES to take it. Txt STOP to opt out." },
  { id: "t6", name: "Review request", channel: "sms", category: "Reputation", subject: "", body: "Thanks for visiting, {{first_name}}! A quick review helps us a lot: {{review_link}}" },
];

export const socialPosts: SocialPost[] = [
  { id: "p1", platform: "instagram", caption: "Before and after: a full smile makeover done in two visits.", hashtags: ["#smilemakeover", "#dentistry"], status: "published", scheduled_for: "2026-08-14T12:00:00Z", has_image: true, likes: 214, comments: 18, reach: 3400 },
  { id: "p2", platform: "facebook", caption: "Meet Dr. Adeyemi, our lead implant dentist.", hashtags: ["#meettheteam"], status: "published", scheduled_for: "2026-08-16T09:00:00Z", has_image: true, likes: 96, comments: 7, reach: 1800 },
  { id: "p3", platform: "tiktok", caption: "Three signs you are brushing too hard.", hashtags: ["#dentaltips", "#oralhealth"], status: "scheduled", scheduled_for: "2026-08-22T17:00:00Z", has_image: true },
  { id: "p4", platform: "instagram", caption: "Whitening week is here — 20% off all month.", hashtags: ["#whitening", "#offer"], status: "needs_approval", scheduled_for: "2026-08-24T10:00:00Z", has_image: true },
  { id: "p5", platform: "google", caption: "New Saturday opening hours from September.", hashtags: [], status: "scheduled", scheduled_for: "2026-08-26T08:00:00Z", has_image: false },
  { id: "p6", platform: "x", caption: "Sugar-free does not mean acid-free. Here is why that matters.", hashtags: ["#oralhealth"], status: "draft", scheduled_for: "2026-08-28T13:00:00Z", has_image: false },
];

export const contentIdeas: ContentIdea[] = [
  { id: "i1", title: "Before & after reveal", category: "Social proof", caption: "Swipe to see a two-visit transformation.", hashtags: ["#beforeandafter", "#smilemakeover"] },
  { id: "i2", title: "Myth vs fact", category: "Education", caption: "Myth: whitening damages enamel. Fact: professional whitening is enamel-safe.", hashtags: ["#dentalmyths"] },
  { id: "i3", title: "Meet the team", category: "Trust", caption: "The friendly face you meet at reception.", hashtags: ["#meettheteam"] },
  { id: "i4", title: "Patient testimonial", category: "Social proof", caption: "\"I finally stopped hiding my smile.\"", hashtags: ["#patientstory"] },
  { id: "i5", title: "Behind the scenes", category: "Trust", caption: "How we sterilise every instrument between patients.", hashtags: ["#dentalhygiene"] },
  { id: "i6", title: "Seasonal offer", category: "Promotion", caption: "Back-to-school checkups for the whole family.", hashtags: ["#familydentistry"] },
  { id: "i7", title: "Quick tip reel", category: "Education", caption: "Flossing in 20 seconds, done right.", hashtags: ["#dentaltips"] },
  { id: "i8", title: "FAQ answer", category: "Education", caption: "Do implants hurt? Here is the honest answer.", hashtags: ["#dentalimplants"] },
];

export const patientReviews: PatientReview[] = [
  { id: "r1", patient_name: "Grace Okoro", rating: 5, source: "google", comment: "Painless treatment and a lovely team. Highly recommend.", created_at: "2026-08-17T11:00:00Z", replied: true, featured: true },
  { id: "r2", patient_name: "Daniel Meyer", rating: 4, source: "google", comment: "Great care, waiting room was a bit busy.", created_at: "2026-08-15T15:20:00Z", replied: false, featured: false },
  { id: "r3", patient_name: "Amina Bello", rating: 5, source: "in_app", comment: "Best dental experience I have had in years.", created_at: "2026-08-11T09:45:00Z", replied: true, featured: true },
  { id: "r4", patient_name: "Tom Harris", rating: 3, source: "facebook", comment: "Treatment was fine but booking by phone was slow.", created_at: "2026-08-08T13:10:00Z", replied: false, featured: false },
];

export const referrals: Referral[] = [
  { id: "rf1", referrer_name: "Grace Okoro", referral_code: "GRACE20", referred_name: "Ijeoma A.", status: "treated", reward: "Free whitening top-up", reward_status: "issued", created_at: "2026-08-02T10:00:00Z" },
  { id: "rf2", referrer_name: "Daniel Meyer", referral_code: "DAN20", referred_name: "Peter M.", status: "booked", reward: "₦10,000 credit", reward_status: "pending", created_at: "2026-08-10T10:00:00Z" },
  { id: "rf3", referrer_name: "Amina Bello", referral_code: "AMINA20", referred_name: "Zainab B.", status: "invited", reward: "₦10,000 credit", reward_status: "pending", created_at: "2026-08-18T10:00:00Z" },
];

export const promotions: Promotion[] = [
  { id: "pr1", name: "Spring whitening", code: "BRIGHT20", discount: "20% off", description: "Professional in-chair whitening", starts_at: "2026-08-01", expires_at: "2026-09-30", usage_limit: 100, used: 37, active: true },
  { id: "pr2", name: "Family checkup bundle", code: "FAMILY4", discount: "₦25,000 off", description: "Four checkups booked together", starts_at: "2026-08-15", expires_at: "2026-10-15", usage_limit: 50, used: 11, active: true },
  { id: "pr3", name: "New patient exam", code: "WELCOME", discount: "Free consult", description: "First visit exam and x-ray", starts_at: "2026-06-01", expires_at: "2026-12-31", usage_limit: 300, used: 128, active: true },
  { id: "pr4", name: "Kids month", code: "KIDS26", discount: "15% off", description: "All pediatric treatments", starts_at: "2026-05-01", expires_at: "2026-05-31", usage_limit: 80, used: 74, active: false },
];

export const recallSegments: RecallSegment[] = [
  { id: "rs1", name: "Due for 6-month recall", description: "Last hygiene visit 5-7 months ago", count: 216, potential_value: 21600, urgency: "high" },
  { id: "rs2", name: "No-show follow-up", description: "Missed an appointment in the last 30 days", count: 38, potential_value: 5700, urgency: "high" },
  { id: "rs3", name: "Lapsed 12+ months", description: "No visit in over a year", count: 341, potential_value: 40900, urgency: "medium" },
  { id: "rs4", name: "Accepted plan, not scheduled", description: "Treatment plan approved but no booking", count: 52, potential_value: 31200, urgency: "high" },
  { id: "rs5", name: "Birthdays this month", description: "A warm touchpoint with a small gift", count: 44, potential_value: 2200, urgency: "low" },
  { id: "rs6", name: "Whitening enquiries", description: "Asked about cosmetic work, never booked", count: 97, potential_value: 14550, urgency: "medium" },
];

export const channelPerformance = [
  { channel: "Email", reached: 812, booked: 94, revenue: 21400 },
  { channel: "SMS", reached: 402, booked: 61, revenue: 12900 },
  { channel: "Social", reached: 5400, booked: 38, revenue: 9100 },
  { channel: "Referrals", reached: 96, booked: 44, revenue: 15600 },
  { channel: "Google", reached: 2100, booked: 71, revenue: 18300 },
];

export const monthlyTrend = [
  { month: "Mar", reached: 1800, booked: 62, revenue: 11200 },
  { month: "Apr", reached: 2100, booked: 78, revenue: 14100 },
  { month: "May", reached: 2600, booked: 91, revenue: 17400 },
  { month: "Jun", reached: 2450, booked: 88, revenue: 16800 },
  { month: "Jul", reached: 3100, booked: 122, revenue: 24500 },
  { month: "Aug", reached: 3600, booked: 145, revenue: 29800 },
];

export const newPatientSources = [
  { name: "Google", value: 38 },
  { name: "Referral", value: 24 },
  { name: "Social", value: 18 },
  { name: "Website", value: 13 },
  { name: "Walk-in", value: 7 },
];

export const funnelStages = [
  { stage: "Reached", value: 3600 },
  { stage: "Engaged", value: 1180 },
  { stage: "Clicked", value: 470 },
  { stage: "Booked", value: 145 },
  { stage: "Treated", value: 118 },
];

export const lifecycleJourneys = [
  { id: "j1", name: "New patient welcome", trigger: "First appointment booked", steps: 3, enrolled: 42, active: true },
  { id: "j2", name: "Post-treatment care", trigger: "Treatment completed", steps: 2, enrolled: 87, active: true },
  { id: "j3", name: "Recall reminder", trigger: "5 months since hygiene visit", steps: 3, enrolled: 216, active: true },
  { id: "j4", name: "Birthday greeting", trigger: "Patient birthday", steps: 1, enrolled: 44, active: false },
  { id: "j5", name: "Win-back", trigger: "12 months inactive", steps: 4, enrolled: 341, active: false },
];