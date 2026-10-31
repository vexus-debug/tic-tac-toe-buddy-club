import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function requireSuperAdmin(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: u, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !u.user) throw new Error("Please sign in again");
  const { data: ok } = await supabaseAdmin.rpc("is_super_admin", { _user_id: u.user.id });
  if (!ok) throw new Error("Only super admins can manage outreach");
  return supabaseAdmin;
}

const base = z.object({ token: z.string().min(10), campaignId: z.string().uuid() });

type Admin = Awaited<ReturnType<typeof requireSuperAdmin>>;

/** Sends batches directly from the server until done, paused, or the per-call cap is hit. */
async function runDispatch(db: Admin, campaignId: string) {
  const { dispatchChunk } = await import("./outreachSender.server");
  for (let i = 0; i < 40; i++) {
    const r = await dispatchChunk(db, campaignId);
    if (r.status !== "sending" || r.remaining <= 0) return r;
  }
}

export const sendOutreachTest = createServerFn({ method: "POST" })
  .inputValidator((d) => base.extend({ testEmail: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data }) => {
    const db = await requireSuperAdmin(data.token);
    const { sendTest } = await import("./outreachSender.server");
    return sendTest(db, data.campaignId, data.testEmail);
  });

/** Sends one chunk; the admin UI calls it repeatedly until remaining is 0. */
export const dispatchOutreachChunk = createServerFn({ method: "POST" })
  .inputValidator((d) => base.parse(d))
  .handler(async ({ data }) => {
    const db = await requireSuperAdmin(data.token);
    const { dispatchChunk } = await import("./outreachSender.server");
    return dispatchChunk(db, data.campaignId);
  });

export const pauseOutreachCampaign = createServerFn({ method: "POST" })
  .inputValidator((d) => base.parse(d))
  .handler(async ({ data }) => {
    const db = await requireSuperAdmin(data.token);
    await db.from("outreach_campaigns").update({ status: "paused" }).eq("id", data.campaignId).eq("status", "sending");
    return { ok: true };
  });

export const resumeOutreachCampaign = createServerFn({ method: "POST" })
  .inputValidator((d) => base.parse(d))
  .handler(async ({ data }) => {
    const db = await requireSuperAdmin(data.token);
    await db.from("outreach_campaigns").update({ status: "sending" }).eq("id", data.campaignId).eq("status", "paused");
    await runDispatch(db, data.campaignId);
    return { ok: true };
  });

/** Starts background sending. The database wakes the cloud sender; no browser needed. */
export const launchOutreachCampaign = createServerFn({ method: "POST" })
  .inputValidator((d) => base.parse(d))
  .handler(async ({ data }) => {
    const db = await requireSuperAdmin(data.token);
    const { data: c } = await db.from("outreach_campaigns").select("subject, html_content, status").eq("id", data.campaignId).maybeSingle();
    if (!c) throw new Error("Campaign not found");
    if (!c.subject.trim() || !c.html_content.trim()) throw new Error("Add a subject and email content first");
    if (!["draft", "failed", "paused"].includes(c.status)) throw new Error(`Campaign is already ${c.status}`);
    const { count } = await db.from("outreach_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", data.campaignId);
    if (!count) throw new Error("Add at least one recipient first");
    await db.from("outreach_campaigns").update({
      status: "sending", total_recipients: count,
      ...(c.status === "draft" ? { started_at: new Date().toISOString() } : {}),
    }).eq("id", data.campaignId);
    await runDispatch(db, data.campaignId);
    return { ok: true, total: count };
  });
