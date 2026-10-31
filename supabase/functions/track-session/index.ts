import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip");
}

async function lookupLocation(ip: string | null) {
  if (!ip || ip.startsWith("127.") || ip.startsWith("192.168.") || ip === "::1") return {};
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) return {};
    const data = await res.json();
    return {
      city: data.city ?? null,
      region: data.region ?? null,
      country: data.country_name ?? null,
    };
  } catch (_e) {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await anon.auth.getUser();
    if (userError || !userData.user) {
      // Background tracking: ignore silently instead of surfacing an error
      return new Response(JSON.stringify({ ok: false, skipped: "unauthenticated" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      session_key,
      device_type,
      os,
      browser,
      is_pwa,
      current_path,
      org_slug,
      event,
    } = body ?? {};

    if (!session_key || typeof session_key !== "string") {
      return new Response(JSON.stringify({ error: "session_key required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (event === "signout") {
      await admin
        .from("user_sessions")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("session_key", session_key);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = clientIp(req);
    const location = await lookupLocation(ip);

    const { error } = await admin.from("user_sessions").upsert(
      {
        user_id: userData.user.id,
        session_key,
        device_type: device_type ?? null,
        os: os ?? null,
        browser: browser ?? null,
        user_agent: req.headers.get("user-agent"),
        is_pwa: !!is_pwa,
        ip,
        ...location,
        current_path: current_path ?? null,
        org_slug: org_slug ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,session_key" },
    );

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("track-session error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
