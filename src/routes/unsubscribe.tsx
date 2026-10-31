import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: z.object({ status: z.enum(["done", "invalid"]).optional() }),
  head: () => ({
    meta: [
      { title: "Unsubscribed — Clinexus" },
      { name: "description", content: "Manage your Clinexus outreach email preferences." },
      { property: "og:title", content: "Unsubscribed — Clinexus" },
      { property: "og:description", content: "You will no longer receive Clinexus outreach emails." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { status } = Route.useSearch();
  const ok = status !== "invalid";
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          {ok ? "You're unsubscribed" : "Link not recognised"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {ok
            ? "Your email has been removed from Clinexus outreach. You won't receive further campaign emails from us."
            : "This unsubscribe link is invalid or has expired. Reply to any of our emails and we'll remove you manually."}
        </p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          Go to Clinexus
        </Link>
      </div>
    </main>
  );
}
