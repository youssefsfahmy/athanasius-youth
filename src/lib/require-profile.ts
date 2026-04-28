import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("servant_profiles")
    .select("id, family_group")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/profile");

  return {
    user,
    profileId: profile.id,
    familyGroup: profile.family_group as string | null,
  };
}
