import { createFileRoute } from "@tanstack/react-router";

const GIF = Uint8Array.from(
  atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"),
  (c) => c.charCodeAt(0),
);

function pixel() {
  return new Response(GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export const Route = createFileRoute("/api/public/outreach/track-open")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { isToken, recordOpen } = await import("@/lib/outreachTracking");
        const t = new URL(request.url).searchParams.get("t");
        if (isToken(t)) {
          try { await recordOpen(t, request); } catch (e) { console.error("track-open", e); }
        }
        return pixel();
      },
    },
  },
});
