import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { InviteServantForm } from "./invite-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("servant_profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {profile ? "Edit Profile" : "Create Profile"}
      </h1>

      {!profile && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            You don&apos;t have a servant profile yet. Create one to be
            identified when recording attendance and checkups.
          </p>
        </div>
      )}

      <ProfileForm
        defaultName={profile?.full_name || ""}
        defaultFamilyGroup={profile?.family_group || ""}
        email={user.email || ""}
        createdAt={profile?.created_at || null}
      />

      {profile && (
        <div className="mt-8">
          <InviteServantForm />
        </div>
      )}
    </div>
  );
}
