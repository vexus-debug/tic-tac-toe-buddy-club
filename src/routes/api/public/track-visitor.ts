import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Public ingestion endpoint for front-end visitor analytics.
 * Visitors POST pageviews / heartbeats / exits here; the server enriches
 * each session with the caller's IP + geo and stores everything via the
 * service-role client. Only super admins can read the data (RLS).
 */

const utmSchema = z.object({
  source: z.string().max(120).optional(),
  medium: z.string().max(120).optional(),
  campaign: z.string().max(180).optional(),
  term: z.string().max(180).optional(),
  content: z.string().max(180).optional(),
});

const fingerprintSchema = z.object({
  device_type: z.string().max(20).optional(),
  os: z.string().max(40).optional(),
  browser: z.string().max(40).optional(),
  screen_resolution: z.string().max(20).optional(),
  pixel_ratio: z.string().max(10).optional(),
  gpu_renderer: z.string().max(200).optional(),
  cpu_cores: z.number().int().min(1).max(256).optional(),
  device_memory_gb: z.number().int().min(1).max(64).optional(),
  timezone: z.string().max(80).optional(),
  locale: z.string().max(40).optional(),
  touch_points: z.number().int().min(0).max(10).optional(),
  is_pwa: z.boolean().optional(),
  fingerprint_hash: z.string().max(80).optional(),
});

const bodySchema = z.object({
  session_id: z.string().min(8).max(64).regex(/^[\w-]+$/),
  visitor_id: z.string().min(8).max(64).regex(/^[\w-]+$/),
  event_type: z.enum(["pageview", "heartbeat", "exit", "click", "scroll"]),
  path: z.string().max(400).optional(),
  referrer_url: z.string().max(600).optional(),
  utm: utmSchema.optional(),
  fingerprint: fingerprintSchema.optional(),
  duration_seconds: z.number().int().min(0).max(172800).optional(),
  page_views_count: z.number().int().min(0).max(2000).optional(),
  is_bounced: z.boolean().optional(),
  is_new_session: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

function clientIp(request: Request): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip");
}

function isPrivateIp(ip: string | null): boolean {
  if (!ip) return true;
  return (
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip === "::1" ||
    ip === "unknown"
  );
}

interface Geo {
  country?: string | null;
  region?: string | null;
  city?: string | null;
}

async function geoLookup(ip: string | null): Promise<Geo> {
  if (isPrivateIp(ip)) return {};
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) return {};
    const data = (await res.json()) as Record<string, unknown>;
    return {
      country: (data.country_name as string) ?? null,
      region: (data.region as string) ?? null,
      city: (data.city as string) ?? null,
    };
  } catch {
    return {};
  }
}

const REFERRER_MAP: [RegExp, string][] = [
  [/google\./i, "Google"],
  [/bing\./i, "Bing"],
  [/facebook\.com|fb\.com/i, "Facebook"],
  [/instagram\.com/i, "Instagram"],
  [/twitter\.com|x\.com|t\.co/i, "X (Twitter)"],
  [/linkedin\.com/i, "LinkedIn"],
  [/youtube\.com|youtu\.be/i, "YouTube"],
  [/tiktok\.com/i, "TikTok"],
  [/wa\.me|whatsapp\.com/i, "WhatsApp"],
  [/telegram\./i, "Telegram"],
  [/reddit\.com/i, "Reddit"],
  [/nairaland\.com/i, "Nairaland"],
];

function referrerName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const [pattern, name] of REFERRER_MAP) {
      if (pattern.test(host)) return name;
    }
    return host || "Direct";
  } catch {
    return "Direct";
  }
}

export const Route = createFileRoute("/api/public/track-visitor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.json().catch(() => null);
          const parsed = bodySchema.safeParse(raw);
          if (!parsed.success) {
            return Response.json({ error: "invalid payload" }, { status: 400 });
          }
          const d = parsed.data;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const admin = supabaseAdmin;

          const now = new Date().toISOString();
          const ip = clientIp(request);
          const { data: existing } = await admin
            .from("visitor_sessions")
            .select("id")
            .eq("session_id", d.session_id)
            .maybeSingle();

          if (!existing) {
            const geo = await geoLookup(ip);
            const fp = d.fingerprint ?? {};
            const { error } = await admin.from("visitor_sessions").insert({
              session_id: d.session_id,
              visitor_id: d.visitor_id,
              ip,
              country: geo.country ?? null,
              region: geo.region ?? null,
              city: geo.city ?? null,
              referrer_url: d.referrer_url ?? null,
              referrer_name: d.referrer_url ? referrerName(d.referrer_url) : "Direct",
              utm_source: d.utm?.source ?? null,
              utm_medium: d.utm?.medium ?? null,
              utm_campaign: d.utm?.campaign ?? null,
              utm_term: d.utm?.term ?? null,
              utm_content: d.utm?.content ?? null,
              landing_page: d.path ?? null,
              exit_page: d.path ?? null,
              user_agent: request.headers.get("user-agent"),
              fingerprint_hash: fp.fingerprint_hash ?? null,
              device_type: fp.device_type ?? null,
              os: fp.os ?? null,
              browser: fp.browser ?? null,
              screen_resolution: fp.screen_resolution ?? null,
              pixel_ratio: fp.pixel_ratio ?? null,
              gpu_renderer: fp.gpu_renderer ?? null,
              cpu_cores: fp.cpu_cores ?? null,
              device_memory_gb: fp.device_memory_gb ?? null,
              timezone: fp.timezone ?? null,
              locale: fp.locale ?? null,
              touch_points: fp.touch_points ?? null,
              is_pwa: fp.is_pwa ?? false,
              duration_seconds: d.duration_seconds ?? 0,
              page_views_count: d.page_views_count ?? 0,
              is_bounced: d.is_bounced ?? false,
              started_at: now,
              last_seen_at: now,
            });
            if (error) throw error;
          } else {
            const update: {
              last_seen_at: string;
              exit_page?: string;
              duration_seconds?: number;
              page_views_count?: number;
              is_bounced?: boolean;
            } = {
              last_seen_at: now,
            };
            if (d.path) update.exit_page = d.path;
            if (d.duration_seconds !== undefined) update.duration_seconds = d.duration_seconds;
            if (d.page_views_count !== undefined) update.page_views_count = d.page_views_count;
            if (d.is_bounced !== undefined) update.is_bounced = d.is_bounced;
            const { error } = await admin
              .from("visitor_sessions")
              .update(update)
              .eq("session_id", d.session_id);
            if (error) throw error;
          }

          if (d.event_type === "pageview" || d.event_type === "click" || d.event_type === "scroll") {
            const { error } = await admin.from("visitor_events").insert({
              session_id: d.session_id,
              visitor_id: d.visitor_id,
              path: d.path ?? null,
              event_type: d.event_type,
              metadata: (d.metadata ?? null) as import("@/integrations/supabase/types").Json,
            });
            if (error) throw error;
          }

          return Response.json({ ok: true });
        } catch (e) {
          console.error("track-visitor error", e);
          return Response.json({ error: "internal error" }, { status: 500 });
        }
      },
    },
  },
});
