// Server-side helpers for the outreach tracking engine. Only call from server
// route handlers; the admin client is loaded lazily inside each function.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isToken(t: string | null): t is string {
  return !!t && UUID_RE.test(t);
}

export function clientIp(request: Request): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type CounterField =
  | "sent_count" | "delivered_count" | "opened_count" | "unique_opened_count"
  | "clicked_count" | "unique_clicked_count" | "bounced_count"
  | "complained_count" | "unsubscribed_count" | "failed_count";

async function bump(campaignId: string, field: CounterField) {
  const db = await admin();
  await db.rpc("outreach_increment_campaign", { p_campaign_id: campaignId, p_field: field, p_by: 1 });
}

// Status precedence so a later "open" doesn't overwrite "clicked" etc.
const RANK: Record<string, number> = {
  pending: 0, sent: 1, delivered: 2, opened: 3, clicked: 4,
  failed: 5, bounced: 6, complained: 7, unsubscribed: 8,
};
function upgrade(current: string, next: string) {
  return (RANK[next] ?? 0) > (RANK[current] ?? 0) ? next : current;
}

async function findByToken(token: string) {
  const db = await admin();
  const { data } = await db
    .from("outreach_recipients")
    .select("id, campaign_id, recipient_email, status, open_count, click_count, first_opened_at, unsubscribed_at")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  return data;
}

export async function recordOpen(token: string, request: Request) {
  const r = await findByToken(token);
  if (!r) return;
  const db = await admin();
  const now = new Date().toISOString();
  const ua = request.headers.get("user-agent");
  const first = !r.first_opened_at;
  await db.from("outreach_recipients").update({
    open_count: r.open_count + 1,
    first_opened_at: r.first_opened_at ?? now,
    last_opened_at: now,
    last_user_agent: ua,
    status: upgrade(r.status, "opened"),
  }).eq("id", r.id);
  await db.from("outreach_events").insert({
    campaign_id: r.campaign_id, recipient_id: r.id, event_type: "opened",
    source: "pixel", ip_address: clientIp(request), user_agent: ua,
  });
  await bump(r.campaign_id, "opened_count");
  if (first) await bump(r.campaign_id, "unique_opened_count");
}

export async function recordClick(token: string, url: string, request: Request) {
  const r = await findByToken(token);
  if (!r) return;
  const db = await admin();
  const now = new Date().toISOString();
  const ua = request.headers.get("user-agent");
  const first = r.click_count === 0;
  await db.from("outreach_recipients").update({
    click_count: r.click_count + 1,
    clicked_at: now,
    last_user_agent: ua,
    status: upgrade(r.status, "clicked"),
  }).eq("id", r.id);
  await db.from("outreach_events").insert({
    campaign_id: r.campaign_id, recipient_id: r.id, event_type: "clicked",
    source: "proxy", ip_address: clientIp(request), user_agent: ua, target_url: url.slice(0, 2000),
  });
  await bump(r.campaign_id, "clicked_count");
  if (first) await bump(r.campaign_id, "unique_clicked_count");
}

async function suppress(email: string, reason: "unsubscribed" | "bounced" | "complained", campaignId: string | null) {
  const db = await admin();
  const lower = email.trim().toLowerCase();
  const { data: existing } = await db.from("outreach_suppressions").select("id").ilike("email", lower).maybeSingle();
  if (!existing) {
    await db.from("outreach_suppressions").insert({ email: lower, reason, campaign_id: campaignId });
  }
}

/** Returns true when the token matched a recipient. Idempotent. */
export async function recordUnsubscribe(token: string, request: Request): Promise<boolean> {
  const r = await findByToken(token);
  if (!r) return false;
  await suppress(r.recipient_email, "unsubscribed", r.campaign_id);
  if (r.unsubscribed_at) return true;
  const db = await admin();
  await db.from("outreach_recipients").update({
    status: "unsubscribed", unsubscribed_at: new Date().toISOString(),
  }).eq("id", r.id);
  await db.from("outreach_events").insert({
    campaign_id: r.campaign_id, recipient_id: r.id, event_type: "unsubscribed",
    source: "unsubscribe", ip_address: clientIp(request), user_agent: request.headers.get("user-agent"),
  });
  await bump(r.campaign_id, "unsubscribed_count");
  return true;
}

/** Applies a verified Resend webhook event. */
export async function applyResendEvent(type: string, emailId: string, payload: unknown) {
  const db = await admin();
  const { data: r } = await db
    .from("outreach_recipients")
    .select("id, campaign_id, recipient_email, status, delivered_at, bounced_at")
    .eq("resend_email_id", emailId)
    .maybeSingle();
  if (!r) return;
  const now = new Date().toISOString();
  const short = type.replace(/^email\./, "");
  await db.from("outreach_events").insert({
    campaign_id: r.campaign_id, recipient_id: r.id, event_type: short,
    source: "webhook", payload: payload as import("@/integrations/supabase/types").Json,
  });
  if (type === "email.delivered" && !r.delivered_at) {
    await db.from("outreach_recipients").update({ delivered_at: now, status: upgrade(r.status, "delivered") }).eq("id", r.id);
    await bump(r.campaign_id, "delivered_count");
  } else if (type === "email.bounced" && !r.bounced_at) {
    await db.from("outreach_recipients").update({ bounced_at: now, status: "bounced" }).eq("id", r.id);
    await suppress(r.recipient_email, "bounced", r.campaign_id);
    await bump(r.campaign_id, "bounced_count");
  } else if (type === "email.complained" && r.status !== "complained") {
    await db.from("outreach_recipients").update({ status: "complained" }).eq("id", r.id);
    await suppress(r.recipient_email, "complained", r.campaign_id);
    await bump(r.campaign_id, "complained_count");
  } else if (type === "email.failed" && r.status !== "failed") {
    await db.from("outreach_recipients").update({ status: "failed" }).eq("id", r.id);
    await bump(r.campaign_id, "failed_count");
  }
}

/** Verifies a Svix-signed (Resend) webhook using Web Crypto. */
export async function verifySvix(secret: string, id: string, ts: string, sigHeader: string, body: string) {
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return false;
  const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const keyBytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return sigHeader.split(" ").some((part) => {
    const sig = part.split(",")[1];
    if (!sig || sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}
