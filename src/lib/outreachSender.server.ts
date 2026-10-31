// Server-only: sends compiled outreach emails through Resend.
import { compileEmail } from "./outreachCompiler";

const BATCH_SIZE = 50;

type Admin = typeof import("@/integrations/supabase/client.server").supabaseAdmin;

interface Campaign {
  id: string; subject: string; html_content: string; plain_text: string | null;
  from_name: string; from_email: string; reply_to: string | null;
  track_opens: boolean; track_clicks: boolean; status: string;
}
interface Recipient {
  id: string; recipient_email: string; recipient_name: string | null;
  clinic_name: string | null; metadata: unknown; unsubscribe_token: string;
}

// Resend key comes from the server environment (RESEND_API_KEY); calls go directly to api.resend.com.
function apiKey() {
  const k = process.env.RESEND_API_KEY;
  if (!k) throw new Error("RESEND_API_KEY is not set in the server environment");
  return k;
}

function varsFor(r: Recipient) {
  const meta = (r.metadata && typeof r.metadata === "object" ? r.metadata : {}) as Record<string, unknown>;
  const name = r.recipient_name ?? "";
  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta)) if (v != null) extra[k.toLowerCase()] = String(v);
  return {
    ...extra,
    name,
    first_name: name.split(/\s+/)[0] || "",
    clinic_name: r.clinic_name ?? "",
    email: r.recipient_email,
  };
}

function build(c: Campaign, r: Recipient, toOverride?: string) {
  const e = compileEmail({
    html: c.html_content, text: c.plain_text, subject: c.subject, token: r.unsubscribe_token,
    trackOpens: c.track_opens, trackClicks: c.track_clicks, vars: varsFor(r),
  });
  return {
    from: `${c.from_name} <${c.from_email}>`,
    to: [toOverride ?? r.recipient_email],
    subject: e.subject, html: e.html, ...(e.text ? { text: e.text } : {}),
    ...(c.reply_to ? { reply_to: c.reply_to } : {}),
    headers: e.headers,
  };
}

async function resend(path: string, body: unknown) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  if (!res.ok) {
    console.error(`Resend ${path} failed [${res.status}]: ${txt}`);
    throw new Error(`Resend rejected the request [${res.status}]: ${txt.slice(0, 300)}`);
  }
  return JSON.parse(txt);
}

export async function sendTest(db: Admin, campaignId: string, to: string) {
  const { data: c } = await db.from("outreach_campaigns").select("*").eq("id", campaignId).maybeSingle();
  if (!c) throw new Error("Campaign not found");
  const fake: Recipient = {
    id: "test", recipient_email: to, recipient_name: "Test Recipient", clinic_name: "Sample Clinic",
    metadata: {}, unsubscribe_token: "00000000-0000-0000-0000-000000000000",
  };
  const email = build(c as Campaign, fake);
  email.subject = `[TEST] ${email.subject}`;
  const out = await resend("/emails", email);
  return { id: out.id as string };
}

/** Sends the next chunk of pending recipients. Call repeatedly until done. */
export async function dispatchChunk(db: Admin, campaignId: string) {
  const { data: c } = await db.from("outreach_campaigns").select("*").eq("id", campaignId).maybeSingle();
  if (!c) throw new Error("Campaign not found");
  const campaign = c as Campaign;
  if (campaign.status === "paused") return { sent: 0, skipped: 0, failed: 0, remaining: -1, status: "paused" };
  if (!campaign.subject.trim() || !campaign.html_content.trim()) throw new Error("Add a subject and email content first");

  if (campaign.status === "draft" || campaign.status === "failed") {
    const { count } = await db.from("outreach_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId);
    await db.from("outreach_campaigns").update({
      status: "sending", started_at: new Date().toISOString(), total_recipients: count ?? 0,
    }).eq("id", campaignId);
  }

  const { data: pending } = await db.from("outreach_recipients")
    .select("id, recipient_email, recipient_name, clinic_name, metadata, unsubscribe_token")
    .eq("campaign_id", campaignId).eq("status", "pending").limit(BATCH_SIZE);
  const list = (pending ?? []) as Recipient[];

  let skipped = 0, failed = 0, sent = 0;
  const now = new Date().toISOString();

  // Pre-flight: drop suppressed addresses.
  const emails = list.map((r) => r.recipient_email.trim().toLowerCase());
  const suppressed = new Set<string>();
  if (emails.length) {
    const { data: s } = await db.from("outreach_suppressions").select("email").in("email", emails);
    for (const row of s ?? []) suppressed.add(row.email.toLowerCase());
  }
  const sendable = list.filter((r) => !suppressed.has(r.recipient_email.trim().toLowerCase()));
  const blocked = list.filter((r) => suppressed.has(r.recipient_email.trim().toLowerCase()));
  if (blocked.length) {
    skipped = blocked.length;
    await db.from("outreach_recipients").update({ status: "failed", error_message: "Skipped: address is on the block list" })
      .in("id", blocked.map((b) => b.id));
  }

  if (sendable.length) {
    try {
      const out = await resend("/emails/batch", sendable.map((r) => build(campaign, r)));
      const ids: { id: string }[] = out.data ?? [];
      for (let i = 0; i < sendable.length; i += 6) {
        await Promise.all(sendable.slice(i, i + 6).map((r, j) =>
          db.from("outreach_recipients").update({
            status: "sent", sent_at: now, resend_email_id: ids[i + j]?.id ?? null, error_message: null,
          }).eq("id", r.id)));
      }
      sent = sendable.length;
    } catch (e) {
      failed = sendable.length;
      await db.from("outreach_recipients").update({ status: "failed", error_message: (e as Error).message.slice(0, 500) })
        .in("id", sendable.map((r) => r.id));
    }
  }

  if (sent) await db.rpc("outreach_increment_campaign", { p_campaign_id: campaignId, p_field: "sent_count", p_by: sent });
  if (failed + skipped) await db.rpc("outreach_increment_campaign", { p_campaign_id: campaignId, p_field: "failed_count", p_by: failed + skipped });

  const { count: remaining } = await db.from("outreach_recipients").select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId).eq("status", "pending");
  let status = "sending";
  if (!remaining) {
    status = "completed";
    await db.from("outreach_campaigns").update({ status, completed_at: new Date().toISOString() }).eq("id", campaignId);
  }
  return { sent, skipped, failed, remaining: remaining ?? 0, status };
}
