import { supabase } from "@/integrations/supabase/client";

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export interface ClinicDetails {
  clinic_name: string;
  clinic_type: string;
  clinic_phone?: string | null;
  clinic_address?: string | null;
  clinic_email?: string | null;
}

/** Creates an organization for the given user and saves its contact details. */
export async function createClinicForUser(userId: string, details: ClinicDetails) {
  const base = slugify(details.clinic_name) || "clinic";
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: orgId, error } = await supabase.rpc("create_org_for_new_user", {
    p_user_id: userId,
    p_clinic_name: details.clinic_name,
    p_slug: slug,
    p_clinic_type: (details.clinic_type || "dental") as "dental",
  });
  if (error) throw error;

  await supabase
    .from("organizations")
    .update({
      phone: details.clinic_phone || null,
      address: details.clinic_address || null,
      email: details.clinic_email || null,
    })
    .eq("id", orgId as string);

  return { orgId: orgId as string, slug };
}
