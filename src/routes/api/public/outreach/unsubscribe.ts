import { createFileRoute } from "@tanstack/react-router";

// GET: footer link click -> process, then show the confirmation page.
// POST: RFC 8058 one-click (List-Unsubscribe-Post) from Gmail/Yahoo.
export const Route = createFileRoute("/api/public/outreach/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const t = url.searchParams.get("t");
        const { isToken, recordUnsubscribe } = await import("@/lib/outreachTracking");
        let ok = false;
        if (isToken(t)) {
          try { ok = await recordUnsubscribe(t, request); } catch (e) { console.error("unsubscribe", e); }
        }
        return new Response(null, {
          status: 302,
          headers: { Location: `/unsubscribe?status=${ok ? "done" : "invalid"}` },
        });
      },
      POST: async ({ request }) => {
        const t = new URL(request.url).searchParams.get("t");
        const { isToken, recordUnsubscribe } = await import("@/lib/outreachTracking");
        if (!isToken(t)) return new Response("Invalid token", { status: 400 });
        try {
          await recordUnsubscribe(t, request);
          return new Response("Unsubscribed", { status: 200 });
        } catch (e) {
          console.error("unsubscribe", e);
          return new Response("Error", { status: 500 });
        }
      },
    },
  },
});
