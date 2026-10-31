import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";
const VISION_MODEL = "qwen-3.8-27b";

const PROMPT = `You are digitising a clinic consent form so it can be reused as a template.
Read the document image and return STRICT JSON only, no markdown fences, with this shape:
{"title": "<short form title>", "category": "<one of: general, surgical, endodontic, implant, orthodontic, anaesthesia, cosmetic, minors, privacy, financial>", "content": "<full form text, cleaned up, preserving headings, numbered clauses and signature lines as plain text>"}
Replace patient-specific handwritten values with placeholders like [PATIENT NAME], [DATE], [TOOTH NUMBER]. Do not invent clauses that are not in the document.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const CEREBRAS_API_KEY = Deno.env.get("CEREBRAS_API_KEY");
    if (!CEREBRAS_API_KEY) {
      return new Response(JSON.stringify({ error: "CEREBRAS_API_KEY is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is an authenticated user of this Supabase project.
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { imageBase64, mimeType, text } = body ?? {};

    if (!imageBase64 && !text) {
      return new Response(JSON.stringify({ error: "Provide either imageBase64 or text." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContent = imageBase64
      ? [
          { type: "text", text: PROMPT },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` },
          },
        ]
      : [{ type: "text", text: `${PROMPT}\n\nDocument text:\n${text}` }];

    const aiRes = await fetch(CEREBRAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        temperature: 0.1,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!aiRes.ok) {
      const errorBody = await aiRes.text();
      console.error(`AI request failed [${aiRes.status}]: ${errorBody}`);
      return new Response(
        JSON.stringify({ error: `Scan failed [${aiRes.status}]: ${errorBody}` }),
        { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const raw: string = aiJson?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed: { title?: string; category?: string; content?: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { title: "Scanned consent form", category: "general", content: cleaned };
    }

    return new Response(
      JSON.stringify({
        title: parsed.title || "Scanned consent form",
        category: parsed.category || "general",
        content: parsed.content || cleaned,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("scan-consent-template error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
