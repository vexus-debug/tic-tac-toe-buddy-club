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

    // Verify caller is authenticated
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

    // Verify caller is super_admin
    const { data: isSuperAdmin } = await supabaseAdmin.rpc("is_super_admin", { _user_id: caller.id });
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, target_user_id, role, new_status, full_name, phone, email, password } = body;

    // Helper to log audit
    const logAudit = async (actionName: string, targetType: string, targetId: string, details: Record<string, unknown>) => {
      await supabaseAdmin.from("platform_audit_log").insert({
        admin_user_id: caller.id,
        action: actionName,
        target_type: targetType,
        target_id: targetId,
        details,
      });
    };

    if (action === "update_account_status") {
      if (!target_user_id || !new_status) {
        return new Response(JSON.stringify({ error: "target_user_id and new_status required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent self-ban
      if (target_user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot change your own account status" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const validStatuses = ["active", "suspended", "banned"];
      if (!validStatuses.includes(new_status)) {
        return new Response(JSON.stringify({ error: "Invalid status" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile status
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({ account_status: new_status })
        .eq("id", target_user_id);

      if (updateErr) throw updateErr;

      // If banned/suspended, optionally disable auth user
      if (new_status === "banned") {
        await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
          ban_duration: "876000h", // ~100 years
        });
      } else if (new_status === "active") {
        await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
          ban_duration: "none",
        });
      } else if (new_status === "suspended") {
        await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
          ban_duration: "876000h",
        });
      }

      await logAudit("user_status_changed", "user", target_user_id, { new_status });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "assign_super_admin") {
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "target_user_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if already has role
      const { data: existing } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", target_user_id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "User already has super_admin role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: insertErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: target_user_id, role: "super_admin" });

      if (insertErr) throw insertErr;

      await logAudit("role_assigned", "user", target_user_id, { role: "super_admin" });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke_super_admin") {
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "target_user_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent self-revoke
      if (target_user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot revoke your own super_admin role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: deleteErr } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", target_user_id)
        .eq("role", "super_admin");

      if (deleteErr) throw deleteErr;

      await logAudit("role_revoked", "user", target_user_id, { role: "super_admin" });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "target_user_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get user email
      const { data: targetUser, error: getUserErr } = await supabaseAdmin.auth.admin.getUserById(target_user_id);
      if (getUserErr || !targetUser?.user?.email) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate a temporary password
      const tempPassword = crypto.randomUUID().slice(0, 12) + "Aa1!";
      const { error: resetErr } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
        password: tempPassword,
      });

      if (resetErr) throw resetErr;

      await logAudit("password_reset", "user", target_user_id, {});

      return new Response(JSON.stringify({ success: true, temp_password: tempPassword }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_user_details") {
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "target_user_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: targetUser, error: getErr } = await supabaseAdmin.auth.admin.getUserById(target_user_id);
      if (getErr || !targetUser?.user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, phone, avatar_url, account_status")
        .eq("id", target_user_id)
        .maybeSingle();

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: target_user_id,
          email: targetUser.user.email ?? "",
          full_name: profile?.full_name ?? "",
          phone: profile?.phone ?? "",
          account_status: profile?.account_status ?? "active",
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_user_details") {
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "target_user_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (typeof password === "string" && password.length > 0 && password.length < 6) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (typeof email === "string" && email.length > 0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return new Response(JSON.stringify({ error: "Invalid email address" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile fields
      const profileUpdates: Record<string, unknown> = {};
      if (typeof full_name === "string") profileUpdates.full_name = full_name;
      if (typeof phone === "string") profileUpdates.phone = phone;
      if (Object.keys(profileUpdates).length > 0) {
        const { error: pErr } = await supabaseAdmin.from("profiles").update(profileUpdates).eq("id", target_user_id);
        if (pErr) throw pErr;
      }

      // Update auth fields
      const authUpdates: Record<string, unknown> = {};
      if (typeof email === "string" && email.length > 0) {
        authUpdates.email = email;
        authUpdates.email_confirm = true;
      }
      if (typeof password === "string" && password.length >= 6) authUpdates.password = password;
      if (typeof full_name === "string") authUpdates.user_metadata = { full_name };

      if (Object.keys(authUpdates).length > 0) {
        const { error: aErr } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, authUpdates);
        if (aErr) {
          return new Response(JSON.stringify({ error: aErr.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      await logAudit("user_details_updated", "user", target_user_id, {
        fields: Object.keys({ ...profileUpdates, ...authUpdates }).filter((k) => k !== "password"),
        password_changed: typeof password === "string" && password.length >= 6,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
