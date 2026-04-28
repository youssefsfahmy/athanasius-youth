"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function createOrUpdateProfile(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const fullName = (formData.get("full_name") as string)?.trim();
  if (!fullName) return { error: "Full name is required" };

  const familyGroup = (formData.get("family_group") as string)?.trim() || null;

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("servant_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("servant_profiles")
      .update({ full_name: fullName, family_group: familyGroup })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("servant_profiles").insert({
      auth_user_id: user.id,
      full_name: fullName,
      family_group: familyGroup,
    });

    if (error) return { error: error.message };
  }

  redirect("/profile");
}

export async function inviteServant(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Email is required" };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Server configuration error" };
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.createUser({
    email,
    password: "aymeeting123",
    email_confirm: true,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: `Account created for ${email}. Temporary password: aymeeting123`,
  };
}
