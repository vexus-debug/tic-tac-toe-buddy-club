import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { org_slug, patient_name, patient_phone, staff_id, treatment_id, appointment_date, appointment_time, notes } = await req.json();

    if (!org_slug || !patient_name || !patient_phone || !staff_id || !appointment_date || !appointment_time) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get org by slug
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", org_slug)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: "Clinic not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Split patient name
    const nameParts = patient_name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "-";

    // Find or create patient by phone + org
    let { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("org_id", org.id)
      .eq("phone", patient_phone)
      .maybeSingle();

    if (!patient) {
      const { data: newPatient, error: patientError } = await supabase
        .from("patients")
        .insert({
          org_id: org.id,
          first_name: firstName,
          last_name: lastName,
          phone: patient_phone,
          referral_source: "website",
        })
        .select("id")
        .single();

      if (patientError) {
        return new Response(JSON.stringify({ error: "Failed to create patient: " + patientError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      patient = newPatient;
    }

    // Create appointment
    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .insert({
        org_id: org.id,
        patient_id: patient!.id,
        staff_id,
        treatment_id: treatment_id || null,
        appointment_date,
        appointment_time,
        notes: notes || "Booked from website",
        status: "scheduled",
      })
      .select("id")
      .single();

    if (apptError) {
      return new Response(JSON.stringify({ error: "Failed to book: " + apptError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, appointment_id: appointment.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
