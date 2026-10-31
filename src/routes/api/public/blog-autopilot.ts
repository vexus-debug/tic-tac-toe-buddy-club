import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily blog autopilot. Call hourly with header `x-cron-secret: <BLOG_CRON_SECRET>`.
 * Each call writes and publishes at most ONE article, for the next category
 * that has no auto article yet today — so 6 calls/day cover all 6 categories.
 */
export const Route = createFileRoute("/api/public/blog-autopilot")({
  server: {
    handlers: {
      POST: async ({ request }) => run(request),
      GET: async ({ request }) => run(request),
    },
  },
});

async function run(request: Request) {
  const given = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  if (!given || given.length < 20) return new Response("Unauthorized", { status: 401 });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const { data: state } = await db.from("blog_autopilot").select("*").eq("id", 1).single();
  if (!state || state.cron_token !== given) return new Response("Unauthorized", { status: 401 });
  const { CATEGORIES, planAutoBrief, writeArticle } = await import("@/lib/blogAi.functions");
  if (!state.enabled) return Response.json({ skipped: "disabled" });
  if (state.paused_reason) return Response.json({ skipped: "paused", reason: state.paused_reason });

  // Single-flight lock (20 min lease)
  const now = new Date();
  const { data: locked } = await db
    .from("blog_autopilot")
    .update({ locked_until: new Date(now.getTime() + 20 * 60000).toISOString() })
    .eq("id", 1)
    .or(`locked_until.is.null,locked_until.lt.${now.toISOString()}`)
    .select("id");
  if (!locked?.length) return Response.json({ skipped: "running" });

  const finish = (patch: Record<string, unknown>) =>
    db.from("blog_autopilot").update({ locked_until: null, last_run_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...patch }).eq("id", 1);

  try {
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const { data: today } = await db.from("blog_articles").select("category").eq("auto_generated", true).gte("created_at", dayStart);
    const done = new Set(((today ?? []) as any[]).map((r) => r.category));
    const category = CATEGORIES.find((c) => !done.has(c));
    if (!category) {
      await finish({ last_result: "All categories done today" });
      return Response.json({ skipped: "done-today" });
    }
    const { data: existing } = await db.from("blog_articles").select("title").eq("category", category).order("created_at", { ascending: false }).limit(60);
    const brief = await planAutoBrief(category, ((existing ?? []) as any[]).map((r) => r.title));
    const res = await writeArticle(db, { brief, category, status: "published", auto: true });
    await finish({ last_result: `Published ${category} article ${res.id}` });
    return Response.json({ ok: true, category, id: res.id });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    const pause = /credit|402|403|declined|not allowed|limit/i.test(msg) ? msg : null;
    await finish({ last_result: `Failed: ${msg}`, ...(pause ? { paused_reason: pause } : {}) });
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
