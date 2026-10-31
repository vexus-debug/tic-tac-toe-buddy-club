import { createFileRoute } from "@tanstack/react-router";

// Background sender: woken by a database trigger each time a campaign starts,
// resumes, or finishes a batch. Verified by a private shared secret.
export const Route = createFileRoute("/api/public/outreach/dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const given = request.headers.get("x-outreach-secret") ?? "";
        const { data: cfg } = await supabaseAdmin.from("outreach_cron_config" as never).select("secret").maybeSingle();
        const secret = (cfg as { secret?: string } | null)?.secret;
        if (!secret || given.length !== secret.length || given !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        let campaignId = "";
        try { campaignId = String(((await request.json()) as { campaignId?: string }).campaignId ?? ""); } catch { /* empty */ }
        if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return new Response("Bad request", { status: 400 });
        try {
          const { dispatchChunk } = await import("@/lib/outreachSender.server");
          const out = await dispatchChunk(supabaseAdmin, campaignId);
          return Response.json(out);
        } catch (e) {
          console.error("outreach dispatch failed", e);
          await supabaseAdmin.from("outreach_campaigns").update({ status: "failed" }).eq("id", campaignId).eq("status", "sending");
          return new Response("Dispatch failed", { status: 500 });
        }
      },
    },
  },
});
