import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const eventSchema = z.object({
  type: z.string().max(60),
  data: z.object({ email_id: z.string().min(1).max(120) }).passthrough(),
});

export const Route = createFileRoute("/api/public/outreach/webhooks/resend")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RESEND_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 503 });

        const body = await request.text();
        const id = request.headers.get("svix-id");
        const ts = request.headers.get("svix-timestamp");
        const sig = request.headers.get("svix-signature");
        const { verifySvix, applyResendEvent } = await import("@/lib/outreachTracking");
        if (!id || !ts || !sig || !(await verifySvix(secret, id, ts, sig, body))) {
          return new Response("Invalid signature", { status: 401 });
        }

        let json: unknown;
        try { json = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }
        const parsed = eventSchema.safeParse(json);
        if (!parsed.success) return new Response("ignored", { status: 200 });

        try {
          await applyResendEvent(parsed.data.type, parsed.data.data.email_id, json);
          return new Response("ok");
        } catch (e) {
          console.error("resend webhook", e);
          return new Response("Error", { status: 500 });
        }
      },
    },
  },
});
