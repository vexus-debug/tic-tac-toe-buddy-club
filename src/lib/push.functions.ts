import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(10),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(1500),
  targetType: z.enum(["all", "clinic", "user"]),
  orgId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
});

export const sendPushNotification = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error: uErr } = await supabaseAdmin.auth.getUser(data.token);
    if (uErr || !u.user) throw new Error("Please sign in again");
    const callerId = u.user.id;
    const { data: isAdmin } = await supabaseAdmin.rpc("is_super_admin", { _user_id: callerId });
    if (!isAdmin) throw new Error("Only super admins can send notifications");
    if (data.targetType === "clinic" && !data.orgId) throw new Error("Choose a clinic");
    if (data.targetType === "user" && !data.userId) throw new Error("Choose a user");

    const { data: msg, error: mErr } = await (supabaseAdmin as any)
      .from("push_messages")
      .insert({
        title: data.title,
        body: data.body,
        target_type: data.targetType,
        target_org_id: data.targetType === "clinic" ? data.orgId : null,
        target_user_id: data.targetType === "user" ? data.userId : null,
        created_by: callerId,
      })
      .select("id")
      .single();
    if (mErr) throw new Error(mErr.message);

    let q = (supabaseAdmin as any).from("push_subscriptions").select("id, endpoint, p256dh, auth, user_id");
    if (data.targetType === "user") q = q.eq("user_id", data.userId);
    if (data.targetType === "clinic") {
      const { data: members } = await supabaseAdmin.from("org_members").select("user_id").eq("org_id", data.orgId!);
      const ids = (members ?? []).map((m: any) => m.user_id);
      if (!ids.length) ids.push("00000000-0000-0000-0000-000000000000");
      q = q.in("user_id", ids);
    }
    const { data: subs } = await q;

    const { buildPushPayload } = await import("@block65/webcrypto-web-push");
    const vapid = {
      subject: "mailto:support@clinexus.com.ng",
      publicKey: process.env["VAPID_PUBLIC_KEY"]!,
      privateKey: process.env["VAPID_PRIVATE_KEY"]!,
    };
    const payloadData = JSON.stringify({ id: msg.id, title: data.title, body: data.body.slice(0, 200) });
    let sent = 0;
    const stale: string[] = [];
    await Promise.all(
      (subs ?? []).map(async (s: any) => {
        try {
          const payload = await buildPushPayload(
            { data: payloadData, options: { ttl: 86400, urgency: "high" } } as any,
            { endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } },
            vapid,
          );
          const res = await fetch(s.endpoint, payload as any);
          if (res.ok) sent++;
          else if (res.status === 404 || res.status === 410) stale.push(s.id);
          else console.error("push failed", res.status, await res.text());
        } catch (e) {
          console.error("push error", e);
        }
      }),
    );
    if (stale.length) await (supabaseAdmin as any).from("push_subscriptions").delete().in("id", stale);
    await (supabaseAdmin as any).from("push_messages").update({ sent_count: sent }).eq("id", msg.id);
    return { sent, devices: subs?.length ?? 0 };
  });
