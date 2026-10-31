import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/outreach/track-click")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const raw = params.get("url") ?? "";
        let dest: URL;
        try {
          dest = new URL(raw);
          if (dest.protocol !== "http:" && dest.protocol !== "https:") throw new Error("bad protocol");
        } catch {
          return new Response("Invalid link", { status: 400 });
        }
        const { isToken, recordClick } = await import("@/lib/outreachTracking");
        const t = params.get("t");
        if (isToken(t)) {
          try { await recordClick(t, dest.toString(), request); } catch (e) { console.error("track-click", e); }
        }
        return new Response(null, {
          status: 302,
          headers: { Location: dest.toString(), "Cache-Control": "no-store" },
        });
      },
    },
  },
});
