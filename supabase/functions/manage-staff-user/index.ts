import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, org_id, email, password, full_name, phone, role, staff_id, user_id } = body;

    // Verify caller has owner/admin access to this org
    const { data: membership } = await supabaseAdmin
      .from("org_members")
      .select("role")
      .eq("user_id", caller.id)
      .eq("org_id", org_id)
      .maybeSingle();

    const { data: isSuperAdmin } = await supabaseAdmin.rpc("is_super_admin", { _user_id: caller.id });

    if (!isSuperAdmin && (!membership || !["owner", "admin", "manager"].includes(membership.role))) {
      return new Response(JSON.stringify({ error: "Forbidden: owner or admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isOwnerOrSuper = isSuperAdmin || membership?.role === "owner";
    const canAppointAdmin = isOwnerOrSuper || membership?.role === "admin";

    if (action === "create_user") {
      if ((role === "admin" || role === "manager") && !canAppointAdmin) {
        return new Response(JSON.stringify({ error: "Managers cannot appoint admins or managers" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = newUser.user.id;

      // Add user as org member with the specified role
      const orgRole = role === "admin" ? "admin"
        : role === "manager" ? "manager"
        : role === "dentist" ? "dentist"
        : role === "hygienist" ? "hygienist"
        : role === "assistant" ? "assistant"
        : role === "receptionist" ? "receptionist"
        : role === "accountant" ? "accountant"
        : role === "lab_technician" ? "lab_technician"
        : role === "lab_assistant" ? "lab_assistant"
        : role === "procurement_officer" ? "procurement_officer"
        : role === "nurse" ? "nurse"
        : "assistant";

      await supabaseAdmin.from("org_members").insert({
        org_id,
        user_id: userId,
        role: orgRole,
      });


      // Link the staff record to the new user
      if (staff_id) {
        await supabaseAdmin.from("staff").update({ user_id: userId }).eq("id", staff_id);
      }

      return new Response(JSON.stringify({ success: true, user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_password") {
      if (!user_id || !password) {
        return new Response(JSON.stringify({ error: "user_id and password are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the target user belongs to the same org
      const { data: targetMembership } = await supabaseAdmin
        .from("org_members")
        .select("id, role")
        .eq("user_id", user_id)
        .eq("org_id", org_id)
        .maybeSingle();

      if (!targetMembership) {
        return new Response(JSON.stringify({ error: "User not found in this organization" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (["owner", "admin", "manager"].includes(targetMembership.role) && !isOwnerOrSuper) {
        return new Response(JSON.stringify({ error: "Only the clinic owner or a super admin can change an admin's password" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }


      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        password,
      });

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_member_details" || action === "update_member_details") {
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the target user belongs to the same org
      const { data: targetMembership } = await supabaseAdmin
        .from("org_members")
        .select("id, role")
        .eq("user_id", user_id)
        .eq("org_id", org_id)
        .maybeSingle();

      if (!targetMembership) {
        return new Response(JSON.stringify({ error: "User not found in this organization" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (
        action === "update_member_details" &&
        ["owner", "admin"].includes(targetMembership.role) &&
        !isOwnerOrSuper
      ) {
        return new Response(JSON.stringify({ error: "Only the clinic owner or a super admin can edit an admin's details" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }


      if (action === "get_member_details") {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user_id);
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user_id)
          .maybeSingle();

        return new Response(JSON.stringify({
          success: true,
          member: {
            user_id,
            email: authUser?.user?.email ?? "",
            full_name: profile?.full_name ?? "",
            phone: profile?.phone ?? "",
            role: targetMembership.role,
          },
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (typeof password === "string" && password.length > 0 && password.length < 6) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (typeof email === "string" && email.length > 0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return new Response(JSON.stringify({ error: "Invalid email address" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const profileUpdates: Record<string, unknown> = {};
      if (typeof full_name === "string") profileUpdates.full_name = full_name;
      if (typeof phone === "string") profileUpdates.phone = phone;
      if (Object.keys(profileUpdates).length > 0) {
        const { error: pErr } = await supabaseAdmin.from("profiles").update(profileUpdates).eq("id", user_id);
        if (pErr) throw pErr;
      }

      const authUpdates: Record<string, unknown> = {};
      if (typeof email === "string" && email.length > 0) {
        authUpdates.email = email;
        authUpdates.email_confirm = true;
      }
      if (typeof password === "string" && password.length >= 6) authUpdates.password = password;
      if (typeof full_name === "string") authUpdates.user_metadata = { full_name };

      if (Object.keys(authUpdates).length > 0) {
        const { error: aErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, authUpdates);
        if (aErr) {
          return new Response(JSON.stringify({ error: aErr.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Keep linked staff record in sync when present
      const staffUpdates: Record<string, unknown> = {};
      if (typeof full_name === "string") staffUpdates.full_name = full_name;
      if (typeof phone === "string") staffUpdates.phone = phone;
      if (typeof email === "string" && email.length > 0) staffUpdates.email = email;
      if (Object.keys(staffUpdates).length > 0) {
        await supabaseAdmin.from("staff").update(staffUpdates).eq("user_id", user_id).eq("org_id", org_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_role") {
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: "user_id and role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Managers can never appoint admins or managers
      if ((role === "admin" || role === "manager") && !canAppointAdmin) {
        return new Response(JSON.stringify({ error: "Managers cannot appoint admins or managers" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the target user belongs to the same org
      const { data: targetMembership } = await supabaseAdmin
        .from("org_members")
        .select("id, role")
        .eq("user_id", user_id)
        .eq("org_id", org_id)
        .maybeSingle();

      if (!targetMembership) {
        return new Response(JSON.stringify({ error: "User not found in this organization" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Only the clinic owner or a super admin can change an owner's or admin's role
      if (["owner", "admin"].includes(targetMembership.role) && !isOwnerOrSuper) {
        return new Response(JSON.stringify({ error: "Only the clinic owner or a super admin can change an admin's role" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: roleError } = await supabaseAdmin
        .from("org_members")
        .update({ role })
        .eq("id", targetMembership.id);

      if (roleError) {
        return new Response(JSON.stringify({ error: roleError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
