// Types mirror the eventual database tables so the mock data can be swapped
// for Supabase queries without changing the UI.

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";
export type Channel = "email" | "sms";

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: Channel;
  subject?: string;
  body: string;
  segment_id: string;
  status: CampaignStatus;
  scheduled_for?: string;
  sent_at?: string;
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  booked: number;
  revenue: number;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  size: number;
  tags: string[];
}

export interface CampaignTemplate {
  id: string;
  name: string;
  channel: Channel;
  subject: string;
  body: string;
  category: string;
}

export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "x" | "google";
export type PostStatus = "draft" | "needs_approval" | "scheduled" | "published";

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  caption: string;
  hashtags: string[];
  status: PostStatus;
  scheduled_for: string;
  has_image: boolean;
  likes?: number;
  comments?: number;
  reach?: number;
}

export interface ContentIdea {
  id: string;
  title: string;
  category: string;
  caption: string;
  hashtags: string[];
}

export interface PatientReview {
  id: string;
  patient_name: string;
  rating: number;
  source: "google" | "facebook" | "in_app";
  comment: string;
  created_at: string;
  replied: boolean;
  featured: boolean;
}

export interface Referral {
  id: string;
  referrer_name: string;
  referral_code: string;
  referred_name: string;
  status: "invited" | "booked" | "treated";
  reward: string;
  reward_status: "pending" | "issued";
  created_at: string;
}

export interface Promotion {
  id: string;
  name: string;
  code: string;
  discount: string;
  description: string;
  starts_at: string;
  expires_at: string;
  usage_limit: number;
  used: number;
  active: boolean;
}

export interface RecallSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  potential_value: number;
  urgency: "high" | "medium" | "low";
}